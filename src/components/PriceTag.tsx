interface PriceTagProps {
  /** Valor em reais (ex: 189.9). `null` mostra "Sob consulta". */
  value: number | null
  className?: string
  mainClassName?: string
  centsClassName?: string
}

// Hierarquia visual de preço (padrão Tulípia oficial): "R$" pequeno, o valor
// inteiro em destaque (maior/mais forte) e os centavos sobrescritos, bem
// menores — em vez de tudo no mesmo tamanho.
function PriceTag({ value, className, mainClassName, centsClassName }: PriceTagProps) {
  if (value == null) {
    return <span className={className}>Sob consulta</span>
  }

  const [reais, centavos] = value
    .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split(',')

  return (
    <span className={className}>
      <span className="mr-0.5 align-top text-[0.55em]">R$</span>
      <span className={mainClassName}>{reais}</span>
      <span className={`align-top text-[0.55em] ${centsClassName ?? ''}`}>
        ,{centavos}
      </span>
    </span>
  )
}

export default PriceTag
