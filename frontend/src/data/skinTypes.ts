import peleAcneica from '../assets/tulipia-banners/pele-acneica.webp'
import peleMadura from '../assets/tulipia-banners/pele-madura.webp'
import peleMista from '../assets/tulipia-banners/pele-mista.webp'
import peleOleosa from '../assets/tulipia-banners/pele-oleosa.webp'
import peleSeca from '../assets/tulipia-banners/pele-seca.webp'
import peleSensivel from '../assets/tulipia-banners/pele-sensivel.webp'
import type { TulipiaProduct } from './tulipiaProducts'

export interface SkinType {
  key: string
  label: string
  image: string
  match: (product: TulipiaProduct) => boolean
}

// Categorização "por tipo de pele" derivada por palavra-chave no NOME do
// produto (o catálogo não tem esse campo pronto). Cada regex abaixo foi
// conferida contra o catálogo real antes de entrar aqui (ver relatório
// final com a contagem
// de produtos por tipo).
export const SKIN_TYPES: SkinType[] = [
  {
    key: 'sensivel',
    label: 'Pele Sensível',
    image: peleSensivel,
    match: (p) => /sensí|calm|acalma|barreira/i.test(p.nome),
  },
  {
    key: 'seca',
    label: 'Pele Seca',
    image: peleSeca,
    match: (p) => /sec[ao]|hidrat|nutri/i.test(p.nome),
  },
  {
    key: 'oleosa',
    label: 'Pele Oleosa',
    image: peleOleosa,
    match: (p) => /oleos|sebo|matific|seborregul/i.test(p.nome),
  },
  {
    key: 'mista',
    label: 'Pele Mista',
    image: peleMista,
    match: (p) => /mist[ao]|equilibr|reequilibr/i.test(p.nome),
  },
  {
    key: 'acneica',
    label: 'Pele Acneica',
    image: peleAcneica,
    match: (p) => p.cuidado.includes('Antiacne') || /acne/i.test(p.nome),
  },
  {
    key: 'madura',
    label: 'Pele Madura',
    image: peleMadura,
    match: (p) =>
      /madur|rugas|firmeza|reafirm|rejuvenesc|colágeno|colageno|expressão|expressao|flaccid|flácid/i.test(
        p.nome,
      ),
  },
]
