'use client';

import {
  buildSeparator,
  centerText,
  formatCurrency,
  formatQty,
  formatSaleDate,
  formatSaleTime,
  formatSeqNumber,
  getMaxChars,
  getPaymentLabel,
  padLeft,
  padRight,
  wrapText,
  type ReceiptConfig,
  type ReceiptData,
} from './receipt-utils';
import './receipt-styles.css';

interface ReceiptProps {
  config: ReceiptConfig;
  data: ReceiptData;
}

export function Receipt({ config, data }: ReceiptProps) {
  const W = getMaxChars(config);
  const sep = buildSeparator(W);
  const thinSep = buildSeparator(W, '.');

  return (
    <div className={`receipt receipt--${config.width === '80mm' ? '80mm' : '58mm'}`}>
        {/* Header */}
        <div className="receipt-header">
          {config.logoUrl && (
            <img src={config.logoUrl} alt="Logo" className="receipt-logo" />
          )}
          {config.businessName && (
            <div className="receipt-business">{config.businessName}</div>
          )}
          {config.address && <div className="receipt-address">{config.address}</div>}
          {config.phone && <div className="receipt-phone">Tel: {config.phone}</div>}
          {config.ruc && <div className="receipt-ruc">RUC: {config.ruc}</div>}
        </div>

        <hr className="receipt-separator" />

        {/* Title + Info */}
        <div className="receipt-title">Boleta de Venta</div>
        <div className="receipt-info">
          {'N\u00b0: '}
          {formatSeqNumber(data.numberSeq)}
          {'\n'}
          {'Fecha: '}
          {formatSaleDate(data.createdAt)}
          {' '}
          {formatSaleTime(data.createdAt)}
          {'\n'}
          {'Cajero: '}
          {data.cashierName}
          {'\n'}
          {'Sucursal: '}
          {data.branchCode}
        </div>

        <hr className="receipt-separator" />

        {/* Items */}
        <div className="receipt-items">
          {data.items.map((item, idx) => {
            const nameLines = wrapText(item.productName, W - 12);
            return (
              // biome-ignore lint/suspicious/noExplicitAny: receipt item key
              <div key={idx} className="receipt-item">
                <div className="receipt-item-row">
                  <span className="receipt-item-qty-price">
                    {padRight(formatQty(item.qty), 6)}
                    {padLeft(formatCurrency(item.unitPrice), 6)}
                  </span>
                  <span className="receipt-item-name">
                    {padRight(nameLines[0] ?? '', W - 14)}
                  </span>
                  <span className="receipt-item-qty-price">
                    {padLeft(formatCurrency(item.total), 8)}
                  </span>
                </div>
                {nameLines.slice(1).map((line, j) => (
                  <div key={j} className="receipt-item-sub">
                    {'                    '}
                    {line}
                  </div>
                ))}
                {item.productSku && (
                  <div className="receipt-item-sub">
                    {'                    '}
                    SKU: {item.productSku}
                  </div>
                )}
                {item.barcode && (
                  <div className="receipt-barcode">
                    <img
                      src={`/api/v1/codes/barcode/ean13/${encodeURIComponent(item.barcode)}`}
                      alt={`EAN-13 ${item.barcode}`}
                      height={30}
                      style={{ display: 'block', margin: '0 auto' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <hr className="receipt-separator" />

        {/* Totals */}
        <div className="receipt-totals">
          <div className="receipt-total-row">
            <span>Subtotal:</span>
            <span>{padLeft(formatCurrency(data.subtotal), 10)}</span>
          </div>
          <div className="receipt-total-row">
            <span>IGV (18%):</span>
            <span>{padLeft(formatCurrency(data.tax), 10)}</span>
          </div>
          {data.discount > 0 && (
            <div className="receipt-total-row">
              <span>Descuento:</span>
              <span>{padLeft(formatCurrency(data.discount), 10)}</span>
            </div>
          )}
          <div className="receipt-total-row receipt-total-row--grand">
            <span>TOTAL:</span>
            <span>{padLeft(formatCurrency(data.total), 10)}</span>
          </div>
        </div>

        <hr className="receipt-separator" />

        {/* Payments */}
        <div className="receipt-payments">
          {data.payments.map((p, idx) => (
            // biome-ignore lint/suspicious/noExplicitAny: receipt payment key
            <div key={idx} className="receipt-total-row">
              <span>{getPaymentLabel(p.method)}:</span>
              <span>{padLeft(formatCurrency(p.amount), 10)}</span>
            </div>
          ))}
          {data.payments.some((p) => p.method === 'CASH') && (
            <div className="receipt-total-row" style={{ marginTop: 2 }}>
              <span>Cambio:</span>
              <span>
                {padLeft(
                  formatCurrency(
                    Math.max(
                      0,
                      data.payments
                        .filter((p) => p.method === 'CASH')
                        .reduce((s, p) => s + p.amount, 0) - data.total,
                    ),
                  ),
                  10,
                )}
              </span>
            </div>
          )}
        </div>

        <hr className="receipt-separator" />

        {/* QR Code */}
        <div className="receipt-qr">
          {data.numberSeq > 0 && (
            <img
              src={`/api/v1/codes/qr/${encodeURIComponent(formatSeqNumber(data.numberSeq))}`}
              alt={`QR ${formatSeqNumber(data.numberSeq)}`}
              width={config.width === '80mm' ? 100 : 80}
              height={config.width === '80mm' ? 100 : 80}
              style={{ display: 'block', margin: '0 auto' }}
            />
          )}
          <div className="receipt-item-sub" style={{ textAlign: 'center', marginTop: 2 }}>
            {formatSeqNumber(data.numberSeq)}
          </div>
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          {config.footerMessage && (
            <>
              {config.footerMessage}
              {'\n'}
            </>
          )}
          {config.returnPolicy && <>{config.returnPolicy}</>}
        </div>
      </div>
  );
}
