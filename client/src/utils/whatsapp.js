// Builds a wa.me link with a pre-filled, URL-encoded message.
export function whatsappLink(number, message) {
  const clean = String(number || '').replace(/[^\d]/g, '');
  const base = clean.startsWith('91') ? clean : `91${clean}`;
  return `https://wa.me/${base}?text=${encodeURIComponent(message)}`;
}

// Full cart checkout message. Delivery fees show as pending when unknown.
export function buildCartCheckoutMessage({
  items,
  subtotal,
  deliveryFee,
  deliveryFeePending,
  total,
  orderReference,
  customerName,
  customerWhatsApp,
  deliveryAddress,
  deliveryMethod,
  currency = '₹',
}) {
  const lines = [
    'Hello The Creative Studio!',
    '',
    'I would like to place an order.',
    '',
    `Order Reference: ${orderReference}`,
    '',
  ];

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name}`);
    if (item.variationsText) lines.push(`   Options: ${item.variationsText}`);
    lines.push(`   Quantity: ${item.quantity}`);
    lines.push(`   Price: ${currency}${item.unitPrice} each`);
    lines.push(`   Subtotal: ${currency}${item.lineSubtotal}`);
    lines.push('');
  });

  lines.push(`Subtotal: ${currency}${subtotal.toLocaleString('en-IN')}`);

  if (deliveryFeePending) {
    lines.push('Delivery Charges: To be confirmed');
    lines.push(`Estimated Total: ${currency}${(total ?? subtotal).toLocaleString('en-IN')}`);
  } else {
    lines.push(`Delivery Charges: ${currency}${(deliveryFee ?? 0).toLocaleString('en-IN')}`);
    lines.push(`Estimated Total: ${currency}${(total ?? subtotal).toLocaleString('en-IN')}`);
  }

  lines.push('');
  lines.push(`Customer Name: ${customerName}`);
  lines.push(`WhatsApp Number: ${customerWhatsApp}`);
  if (deliveryMethod === 'pickup') {
    lines.push('Delivery Method: Local pickup requested');
  } else {
    lines.push(`Delivery Address: ${deliveryAddress}`);
  }
  lines.push('');
  lines.push('Please confirm my order and delivery charges.');
  lines.push('');
  lines.push('Thank you!');

  return lines.join('\n');
}

// Single product "Buy Now" message.
export function buildBuyNowMessage({
  name,
  quantity,
  unitPrice,
  subtotal,
  orderReference,
  customerName,
  deliveryAddress,
  deliveryMethod,
  variationsText,
  currency = '₹',
}) {
  const lines = [
    'Hello The Creative Studio!',
    '',
    'I would like to order this product.',
    '',
    `Order Reference: ${orderReference}`,
    `Product: ${name}`,
  ];
  if (variationsText) lines.push(`Options: ${variationsText}`);
  lines.push(`Quantity: ${quantity}`);
  lines.push(`Price per item: ${currency}${unitPrice}`);
  lines.push(`Subtotal: ${currency}${subtotal}`);
  lines.push('');
  lines.push(`Customer Name: ${customerName}`);
  if (deliveryMethod === 'pickup') {
    lines.push('Delivery Method: Local pickup requested');
  } else {
    lines.push(`Delivery Address: ${deliveryAddress}`);
  }
  lines.push('');
  lines.push('Please confirm availability and delivery details.');
  lines.push('');
  lines.push('Thank you!');

  return lines.join('\n');
}

// Custom order inquiry message.
export function buildCustomOrderMessage({ referenceNumber, customerName, whatsappNumber, productType, occasion, preferredColor, budget, quantity, requiredDate, customizationDetails }) {
  const lines = [
    'Hello The Creative Studio!',
    '',
    'I would like to request a custom order.',
    '',
    `Reference: ${referenceNumber}`,
    `Product Type: ${productType}`,
  ];
  if (occasion) lines.push(`Occasion: ${occasion}`);
  if (preferredColor) lines.push(`Preferred Colors: ${preferredColor}`);
  if (budget) lines.push(`Budget: ₹${Number(budget).toLocaleString('en-IN')}`);
  lines.push(`Quantity: ${quantity}`);
  if (requiredDate) lines.push(`Required By: ${new Date(requiredDate).toLocaleDateString('en-IN')}`);
  lines.push(`Customization Details: ${customizationDetails}`);
  lines.push('');
  lines.push(`Customer Name: ${customerName}`);
  lines.push(`WhatsApp Number: ${whatsappNumber}`);
  lines.push('');
  lines.push('Please let me know the feasibility and estimate. Thank you!');

  return lines.join('\n');
}