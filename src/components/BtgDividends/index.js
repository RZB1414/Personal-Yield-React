import { saveBtgDividends } from '../../services/btgDividends'

export default function BtgDividends() {
	const onFileChange = async (e) => {
		const f = e.target.files?.[0]
		if (!f) return
		try {
			await saveBtgDividends(f)
			// O service já faz console.log dos resultados
		} catch (err) {
			// Mostra erro no console apenas
			console.error('Erro ao ler PDF:', err)
		}
	}

	return (
		<input type="file" accept="application/pdf" onChange={onFileChange} />
	)
}


