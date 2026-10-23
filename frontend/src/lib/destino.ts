// Páginas do próprio fluxo de acesso: voltar para elas depois de entrar
// deixaria a pessoa de volta no formulário
const PAGINAS_DE_ACESSO = ['/login', '/cadastro', '/redefinir-senha']

// Decide para onde ir depois do login, a partir de um destino que veio da URL
// (?destino=...) ou do estado da navegação. Só aceita caminho interno do
// site, para o login não virar um redirecionamento aberto (open redirect:
// um link como /login?destino=https://site-falso.example mandaria a pessoa
// para fora logo depois de digitar a senha). Qualquer outra coisa vai para "/".
export function destinoSeguro(valor: unknown): string {
  if (typeof valor !== 'string') return '/'

  // Precisa começar com "/" e não com "//" (que o navegador lê como outro
  // site); "://" e "\" também são formas de escapar do site
  if (!valor.startsWith('/') || valor.startsWith('//')) return '/'
  if (valor.includes('://') || valor.includes('\\')) return '/'

  // Tabulação e quebra de linha são ignoradas pelo navegador dentro de uma URL
  // ("/\t/outro.site" viraria "//outro.site"), então qualquer caractere de
  // controle invalida o destino
  for (const caractere of valor) {
    const codigo = caractere.charCodeAt(0)
    if (codigo < 32 || codigo === 127) return '/'
  }

  const caminho = valor.split(/[?#]/)[0]
  if (PAGINAS_DE_ACESSO.includes(caminho ?? '')) return '/'

  return valor
}
