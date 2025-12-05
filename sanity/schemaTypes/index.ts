import { type SchemaTypeDefinition } from 'sanity'

import { categoryType } from './categoryType'
import { orderType } from './orderType'
import { productType } from './productType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [categoryType, productType, orderType],
}
