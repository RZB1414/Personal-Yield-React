import axios from 'axios'
import * as XLSX from 'xlsx'
import { bufferToHex, hexToBuffer } from '../utils/crypto'
import { getAllEncryptedDividends, saveData } from './encryptedDividends'

//const dividendsApi = axios.create({ baseURL: 'http://localhost:3000' })
const dividendsApi = axios.create({
    baseURL: 'https://api-yield.vercel.app/',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

// Deriva uma chave AES-GCM a partir da senha e salt
async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Exporta a chave AES-GCM para string hex (64 chars)
async function exportKey(key) {
  try {
    const raw = await window.crypto.subtle.exportKey('raw', key)
    return bufferToHex(raw)
  } catch (error) {
    console.error('Erro ao exportar chave:', error)
    return null
  }
}

// Importa a chave AES-GCM de volta a partir de hex
async function importKeyFromHex(hex) {
  const rawBuffer = hexToBuffer(hex)
  return window.crypto.subtle.importKey(
    'raw',
    rawBuffer,
    { name: 'AES-GCM' },
    false,               // chave não precisa ser re-exportável
    ['encrypt', 'decrypt']
  )
}

// Criptografa um array de dividendos
async function encryptDividends(parsedData, password) {
    const enc = new TextEncoder();
    const records = [];

    for (const item of parsedData) {
        const mov = item.movimentacao instanceof Date ? item.movimentacao.toISOString() : '';
        const liq = item.liquidacao instanceof Date ? item.liquidacao.toISOString() : '';
        const ticker = item.ticker || '';
        const valor = typeof item.valor === 'number' ? item.valor : 0;

        const safeItem = { ...item, movimentacao: mov, liquidacao: liq, ticker, valor };

        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const key = await deriveKey(password, salt);
        const data = enc.encode(JSON.stringify(safeItem));
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        const hashSource = `${mov}|${liq}|${ticker}|${valor}`;
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(hashSource));
        const hashHex = bufferToHex(hashBuffer);

        const userId = sessionStorage.getItem('userId')

        records.push({
            userId: userId,
            encryptedData: bufferToHex(encryptedBuffer),
            salt: bufferToHex(salt),
            iv: bufferToHex(iv),
            hash: hashHex
        });
    }
    return records;
}

// Descriptografa um array de dividendos criptografados
async function decryptDividends(encryptedData, password) {
  if (!Array.isArray(encryptedData) || encryptedData.length === 0) {
    console.warn('Nenhum dado criptografado fornecido para descriptografia.')
    return []
  }

  const dec = new TextDecoder()
  const keyCache = {}
  const results = []

  for (const data of encryptedData) {
    const saltHex = data.salt
    const iv = hexToBuffer(data.iv)
    const encryptedBuffer = hexToBuffer(data.encryptedData)
    const storageKey = `aesKey_${saltHex}`

    let key = keyCache[saltHex]
    if (!key) {
      const storedHex = sessionStorage.getItem(storageKey)
      if (storedHex) {
        key = await importKeyFromHex(storedHex)
      } else {
        if (!password) throw new Error('Senha não disponível para desencriptar dados.')
        const saltBuf = hexToBuffer(saltHex)
        key = await deriveKey(password, new Uint8Array(saltBuf))
        const keyHex = await exportKey(key)
        if (keyHex) sessionStorage.setItem(storageKey, keyHex)
      }
      keyCache[saltHex] = key
    }

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      encryptedBuffer
    )
    const json = dec.decode(decryptedBuffer)
    const parsed = JSON.parse(json)
    results.push({
      ...parsed,
      movimentacao: parsed.movimentacao ? new Date(parsed.movimentacao) : null,
      liquidacao: parsed.liquidacao ? new Date(parsed.liquidacao) : null
    })
  }

  return results
}

async function getAllDividends(userId, password) {
  try {
    const encryptedDividends = await getAllEncryptedDividends(userId)
    if (!encryptedDividends|| encryptedDividends.data.message === 'No records found for this user') {
      return { unfilteredDividends: [], dividends: [] }
    }

    const records = encryptedDividends.data || []
    const unfiltered = await decryptDividends(records, password)
    if (unfiltered.length === 0) {
      return { unfilteredDividends: [], dividends: [] }
    }

    const excluded = [
      "NOTA","TED RETIRADA","TED RECEBIDO","RENDIMENTO RENDA FIXA",
      "PIS E COFINS","MULTA SALDO NEGATIVO","CARTAO DE CREDITO",
      "CASHBACK CARTAO","IOF CASHBACK CARTAO","TRANSF ENVIADA CONTA DIGITAL",
      "TRANSF RECEBIDA CONTA DIGITAL","NEOE26","TAEE17","VAMO34","CTEE29"
    ]

    const dividends = unfiltered.filter(d =>
      d.lancamento !== "FRAÇÕES DE AÇÕES VIVT3" && !excluded.includes(d.ticker)
    )

    return { unfilteredDividends: unfiltered, dividends }
  } catch (error) {
    console.error('Error fetching dividends:', error)
    return { unfilteredDividends: [], dividends: [] }
  }
}

async function createTransaction(transaction) {
    try {
        const response = await dividendsApi.post('/auth/createTransaction', transaction)
        return response.data
    } catch (error) {
        console.error('Error creating transaction:', error)
        throw error
    }
}

async function readFile(file) {
    try {
        // Lê o arquivo XLSX da memória
        const dataReceived = await file.arrayBuffer();
        const workbook = XLSX.read(dataReceived, { type: "array" }); 
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Converte os dados da planilha para JSON
        let data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        let dataMapped

        // Função para converter datas do Excel para objeto Date
        function convertExcelDateToDate(excelDate) {
            if (typeof excelDate === "number") {
                const date = XLSX.SSF.parse_date_code(excelDate);
                return new Date(date.y, date.m - 1, date.d);
            }
            if (typeof excelDate === "string" && excelDate.includes('/')) {
                const [day, month, year] = excelDate.split('/').map(Number);
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    return new Date(year, month - 1, day);
                }
            }
            if (excelDate instanceof Date) return excelDate;
            return null;
        }

        // Função para extrair o ticker do campo "lancamento"
        function extractTicker(lancamento) {
            if (!lancamento || typeof lancamento !== "string") {
                return "SemTicker";
            }
            const blacklist = ["CBLC", "IRRF", "FIRF"];
            const tickerRegex = /\b[A-Z]{4}[0-9]{0,2}\b/g;
            const matches = lancamento.match(tickerRegex);
            if (matches) {
                for (const match of matches) {
                    if (!blacklist.includes(match)) {
                        return match;
                    }
                }
            }
            const brTickerRegex = /BR([A-Z]{4}[0-9]{0,2})/;
            const brMatch = lancamento.match(brTickerRegex);
            if (brMatch) {
                return brMatch[1];
            }
            return null;
        }

        // Renomeia as colunas para os nomes corretos e converte datas para Date
        dataMapped = data.map(row => ({
            movimentacao: convertExcelDateToDate(row["Movimentação"] || row["__EMPTY_1"]),
            liquidacao: convertExcelDateToDate(row["Liquidação"] || row["__EMPTY_2"]),
            lancamento: row["Lançamento"] || row["__EMPTY_3"],
            valor: parseFloat(row["Valor (R$)"] || row["__EMPTY_5"]) || 0,
            ticker: extractTicker(row["Lançamento"] || row["__EMPTY_3"])
        }))

        // Mapeamento de lançamentos permitidos para seus respectivos tickers
        const lancamentoToTicker = {
            "RETIRADA EM C/C": "TED RETIRADA",
            "RECEBIMENTO DE TED - SPB": "TED RECEBIDO",
            "Pgto Juros": "RENDIMENTO RENDA FIXA",
            "PIS E COFINS S/ MULTA": "PIS E COFINS",
            "MULTA S/ SALDO DEVEDOR EM C/C NO DIA ANTERIOR": "MULTA SALDO NEGATIVO",
            "Pagamento para BANCO XP S/A": "CARTAO DE CREDITO",
            "Pagamento agendado para BANCO XP S/A": "CARTAO DE CREDITO",
            "RESGATE Trend Investback FIC FIRF Simples": "CASHBACK CARTAO",
            "IOF S/RESGATE FUNDOS Trend Investback FIC FIRF Simples": "IOF CASHBACK CARTAO",
            "Transferência enviada para a conta digital": "TRANSF ENVIADA CONTA DIGITAL",
            "Transferência recebida da conta digital": "TRANSF RECEBIDA CONTA DIGITAL"
        };

        const allowedLancamentos = Object.keys(lancamentoToTicker)        

        // Filtra os dados para eliminar linhas que não contêm todos os campos necessários
        const dataFiltered = dataMapped.filter(row => {
            if (!row.lancamento || typeof row.lancamento !== "string") {
                return false;
            }
            const lancamento = (row.lancamento || "").trim().toUpperCase();
            const matchedLancamento = allowedLancamentos.find(allowed => lancamento.includes(allowed.toUpperCase()));
            if (matchedLancamento) {
                row.ticker = lancamentoToTicker[matchedLancamento];
            }
            return (
                row.movimentacao instanceof Date &&
                row.lancamento &&
                row.valor &&
                row.ticker &&
                row.movimentacao !== "Movimentação" &&
                row.liquidacao instanceof Date &&
                row.liquidacao !== "Liquidação" &&
                row.lancamento !== "Lançamento" &&
                row.valor !== "Valor (R$)" &&
                row.ticker !== "Ticker"
            );
        })       

        // Todos os dados já são objetos Date
        const parsedData = dataFiltered.map(item => ({
            ...item,
            movimentacao: item.movimentacao instanceof Date ? item.movimentacao : null,
            liquidacao: item.liquidacao instanceof Date ? item.liquidacao : null
        }));

        const password = sessionStorage.getItem('decryptPassword')

        if (!Array.isArray(parsedData)) throw new Error('parsedData não é array!');

        // NOVO: criptografia com Web Crypto API
        const encryptedData = await encryptDividends(parsedData, password);
        
        await saveData({ records: encryptedData });

    } catch (error) {
        console.error("Erro ao salvar os dados:", error);
        let writeErrors = [];
        if (
            error &&
            error.errorResponse &&
            Array.isArray(error.errorResponse.writeErrors)
        ) {
            writeErrors = error.errorResponse.writeErrors.map(e => e.err.op);
        }
        return { message: "Erro ao salvar os dados.", error: writeErrors };
    }
}

export {
    getAllDividends,
    createTransaction,
    readFile,
    decryptDividends
}