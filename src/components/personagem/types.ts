export interface TNode {
  id: string
  label: string
  disc?: string
  mat?: string
  icon?: string
  children?: TNode[]
}

export interface NodeStats {
  count: number
  acc: number
}

export interface Pos {
  x: number
  y: number
}