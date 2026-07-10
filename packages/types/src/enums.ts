export enum Plan {
  STARTER = 'STARTER',
  GROWTH = 'GROWTH',
  PRO = 'PRO',
}

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
}

export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  VOID = 'VOID',
  RETURNED = 'RETURNED',
  PARTIAL_RETURN = 'PARTIAL_RETURN',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  CREDIT = 'CREDIT',
  MIXED = 'MIXED',
}

export enum MovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  RETURN = 'RETURN',
  LOSS = 'LOSS',
}

export enum CashSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  RECONCILING = 'RECONCILING',
}

export enum CodeType {
  EAN13 = 'ean13',
  EAN8 = 'ean8',
  UPC_A = 'upca',
  CODE128 = 'code128',
  QR = 'qr',
}
