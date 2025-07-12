import express from 'express';
const app = express();
const port = 3010;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Almacena las transacciones en memoria
// Para un sistema real se usaría una base de datos
const transactions = {};

// Configuración de tarjetas para pruebas del sistema
// Permite simular diferentes respuestas del banco
const testCards = {
    // Tarjetas que se aprueban sin problemas
    approved: [
        '4111111111111111', // Visa básica
        '4000000000000002', // Visa estándar
        '5555555555554444', // MasterCard básica
        '5200000000000007', // MasterCard estándar
        '378282246310005',  // American Express
        '4000000000000101', // Visa con límite alto
        '5105105105105100'  // MasterCard premium
    ],
    
    // Tarjetas rechazadas por saldo insuficiente
    insufficient_funds: [
        '4000000000000002', // Visa sin fondos
        '4000000000000127', // Visa sin saldo
        '5200000000000049'  // MasterCard sin fondos
    ],
    
    // Tarjetas bloqueadas por robo o pérdida
    stolen_lost: [
        '4000000000000119', // Visa reportada robada
        '4000000000000259', // Visa reportada perdida
        '5200000000000114'  // MasterCard bloqueada
    ],
    
    // Tarjetas con problemas de CVV
    invalid_cvv: [
        '4000000000000101', // Falla si CVV es 000
        '4242424242424241'  // CVV especial para pruebas
    ],
    
    // Tarjetas que necesitan verificación adicional
    requires_3ds: [
        '4000000000000044', // Visa con 3D Secure
        '5200000000000056'  // MasterCard con 3D Secure
    ]
};

// Evalúa si se debe aprobar o rechazar el pago
// Usa el número de tarjeta y otros datos para decidir
function determinePaymentResult(cardNumber, cvv, amount) {
    const cleanCard = cardNumber.replace(/\s/g, '');
    
    // Revisar si la tarjeta está en las listas de prueba
    if (testCards.approved.includes(cleanCard)) {
        return { status: 'AUTHORIZED', reason: 'approved' };
    }
    
    if (testCards.insufficient_funds.includes(cleanCard)) {
        return { status: 'REJECTED', reason: 'insufficient_funds', message: 'Fondos insuficientes' };
    }
    
    if (testCards.stolen_lost.includes(cleanCard)) {
        return { status: 'REJECTED', reason: 'stolen_card', message: 'Tarjeta reportada como robada o perdida' };
    }
    
    // Verificar si el CVV está mal intencionalmente
    if (testCards.invalid_cvv.includes(cleanCard) && cvv === '000') {
        return { status: 'REJECTED', reason: 'invalid_cvv', message: 'Código CVV incorrecto' };
    }
    
    if (testCards.requires_3ds.includes(cleanCard)) {
        return { status: 'REQUIRES_3DS', reason: '3d_secure', message: 'Requiere autenticación 3D Secure' };
    }
    
    // Reglas adicionales según el patrón del número
    const lastDigit = parseInt(cleanCard.slice(-1));
    
    // Rechazar tarjetas que terminan en 0 o 9 por límite
    if (lastDigit === 0 || lastDigit === 9) {
        return { status: 'REJECTED', reason: 'credit_limit', message: 'Límite de crédito excedido' };
    }
    
    // Rechazar compras superiores a $500,000
    if (amount > 500000) {
        return { status: 'REJECTED', reason: 'amount_limit', message: 'Monto excede límite permitido' };
    }
    
    // Aprobar el resto de tarjetas válidas
    return { status: 'AUTHORIZED', reason: 'approved' };
}

// Crea tokens únicos para cada transacción
// Combina fecha y números aleatorios
function generateToken() {
    return `TKN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Genera códigos de autorización alfanuméricos
// Imita el formato de autorizaciones bancarias
function generateAuthCode() {
    return Math.random().toString(36).substr(2, 10).toUpperCase();
}

// Endpoint para crear una nueva transacción
// Recibe los datos de la compra y genera token
app.post('/transactions', (req, res) => {
    const { amount, buy_order, session_id, return_url } = req.body;
    
    // Verificar que lleguen todos los datos necesarios
    if (!amount || !buy_order || !session_id || !return_url) {
        return res.status(400).json({
            error: 'Faltan parámetros requeridos: amount, buy_order, session_id, return_url'
        });
    }
    
    // Verificar que el monto sea válido
    if (amount <= 0 || isNaN(amount)) {
        return res.status(400).json({
            error: 'El monto debe ser un número positivo'
        });
    }
    
    const token = generateToken();
    
    // Guardar la transacción pendiente
    transactions[token] = {
        token,
        amount: parseFloat(amount),
        buy_order,
        session_id,
        return_url,
        status: 'CREATED',
        created_at: new Date().toISOString(),
        authorization_code: null
    };
    
    // Crear la URL donde el usuario pagará
    const paymentUrl = `http://localhost:${port}/pay?token=${token}`;
    
    res.json({
        token,
        url: paymentUrl
    });
});

// Muestra la página de pago al usuario
// Formulario con campos de tarjeta de crédito
app.get('/pay', (req, res) => {
    const { token } = req.query;
    
    if (!token || !transactions[token]) {
        return res.status(404).send('<h1>Transacción no encontrada</h1>');
    }
    
    const transaction = transactions[token];
    
    // HTML del formulario de pago
    // Incluye validaciones y campos obligatorios
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Pasarela de Pagos Segura - Lufa Store</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
            .payment-container { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .payment-header { background: #2c5aa0; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .payment-form { padding: 30px; }
            .form-group { margin-bottom: 20px; }
            .form-label { display: block; font-weight: bold; margin-bottom: 5px; color: #333; }
            .form-control { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 4px; font-size: 16px; transition: border-color 0.3s; }
            .form-control:focus { border-color: #2c5aa0; outline: none; }
            .form-row { display: flex; gap: 15px; }
            .form-col { flex: 1; }
            .amount { font-size: 24px; color: #2c5aa0; margin: 15px 0; text-align: center; }
            .btn-pay { width: 100%; background: #28a745; color: white; padding: 15px; border: none; border-radius: 5px; font-size: 18px; cursor: pointer; margin-top: 20px; }
            .btn-pay:hover { background: #218838; }
            .btn-pay:disabled { background: #6c757d; cursor: not-allowed; }
            .order-info { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2c5aa0; }
            .security-notice { background: #e7f3ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #0066cc; }
            .card-icons { text-align: center; margin: 15px 0; }
            .error { color: #dc3545; font-size: 14px; margin-top: 5px; }
            .lock-icon { color: #28a745; margin-right: 5px; }
        </style>
    </head>
    <body>
        <div class="payment-container">
            <div class="payment-header">
                <h2><span class="lock-icon">🔒</span>Pago Seguro</h2>
                <p>Procesado por Pasarela Segura</p>
            </div>
            
            <div class="payment-form">
                <div class="security-notice">
                    <strong>🛡️ Transacción Segura:</strong> Todos los datos son encriptados y protegidos según estándares PCI DSS.
                </div>
                
                <div class="order-info">
                    <h4>Resumen de Compra</h4>
                    <p><strong>Comercio:</strong> Lufa Store</p>
                    <p><strong>Orden:</strong> ${transaction.buy_order}</p>
                    <div class="amount"><strong>Total: $${transaction.amount.toLocaleString('es-CL')}</strong></div>
                </div>
                
                <form id="payment-form" onsubmit="processPay(event)">
                    <div class="form-group">
                        <label class="form-label" for="card-number">Número de Tarjeta *</label>
                        <input type="text" id="card-number" class="form-control" placeholder="1234 5678 9012 3456" 
                               maxlength="19" required autocomplete="cc-number">
                        <div id="card-error" class="error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="card-name">Nombre del Titular *</label>
                        <input type="text" id="card-name" class="form-control" placeholder="Juan Pérez" 
                               required autocomplete="cc-name">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-col">
                            <label class="form-label" for="card-expiry">Vencimiento *</label>
                            <input type="text" id="card-expiry" class="form-control" placeholder="MM/AA" 
                                   maxlength="5" required autocomplete="cc-exp">
                        </div>
                        <div class="form-col">
                            <label class="form-label" for="card-cvv">CVV *</label>
                            <input type="password" id="card-cvv" class="form-control" placeholder="123" 
                                   maxlength="4" required autocomplete="cc-csc">
                        </div>
                    </div>
                    
                    <div class="card-icons">
                        💳 Aceptamos: Visa, MasterCard, American Express
                    </div>
                    
                    <div class="test-cards-info" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 15px 0; font-size: 14px;">
                        <h6 style="color: #856404; margin-bottom: 10px;">🧪 Tarjetas de Prueba:</h6>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <strong>✅ APROBADAS:</strong><br>
                                4111 1111 1111 1111<br>
                                5555 5555 5555 4444<br>
                                378282246310005
                            </div>
                            <div>
                                <strong>❌ RECHAZADAS:</strong><br>
                                4000 0000 0000 0127 (sin fondos)<br>
                                4000 0000 0000 0119 (robada)<br>
                                Terminadas en 0 o 9 (límite)
                            </div>
                        </div>
                        <small style="color: #856404; margin-top: 10px; display: block;">
                            Usa cualquier nombre, fecha futura (MM/AA) y CVV válido. Para CVV incorrecto usa 000.
                        </small>
                    </div>
                    
                    <button type="submit" class="btn-pay" id="pay-button">
                        🔒 Pagar $${transaction.amount.toLocaleString('es-CL')}
                    </button>
                </form>
            </div>
        </div>
        
        <script>
            // Funciones para validar y formatear datos de tarjetas
            function formatCardNumber(value) {
                const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                const matches = v.match(/\d{4,16}/g);
                const match = matches && matches[0] || '';
                const parts = [];
                
                for (let i = 0, len = match.length; i < len; i += 4) {
                    parts.push(match.substring(i, i + 4));
                }
                
                if (parts.length) {
                    return parts.join(' ');
                } else {
                    return v;
                }
            }
            
            function formatExpiry(value) {
                const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                if (v.length >= 2) {
                    return v.substring(0, 2) + '/' + v.substring(2, 4);
                }
                return v;
            }
            
            function validateCard(number) {
                // Validación estándar de números de tarjeta
                const num = number.replace(/\s/g, '');
                if (num.length < 13 || num.length > 19) return false;
                
                let sum = 0;
                let isEven = false;
                
                for (let i = num.length - 1; i >= 0; i--) {
                    let digit = parseInt(num.charAt(i), 10);
                    
                    if (isEven) {
                        digit *= 2;
                        if (digit > 9) {
                            digit -= 9;
                        }
                    }
                    
                    sum += digit;
                    isEven = !isEven;
                }
                
                return (sum % 10) === 0;
            }
            
            // Configurar formato mientras el usuario escribe
            document.getElementById('card-number').addEventListener('input', function(e) {
                e.target.value = formatCardNumber(e.target.value);
            });
            
            document.getElementById('card-expiry').addEventListener('input', function(e) {
                e.target.value = formatExpiry(e.target.value);
            });
            
            document.getElementById('card-cvv').addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/[^0-9]/gi, '');
            });
            
            function processPay(event) {
                event.preventDefault();
                
                const cardNumber = document.getElementById('card-number').value;
                const cardName = document.getElementById('card-name').value;
                const cardExpiry = document.getElementById('card-expiry').value;
                const cardCvv = document.getElementById('card-cvv').value;
                const errorDiv = document.getElementById('card-error');
                const payButton = document.getElementById('pay-button');
                
                // Borrar mensajes de error anteriores
                errorDiv.textContent = '';
                
                // Verificar que todos los datos sean correctos
                if (!validateCard(cardNumber)) {
                    errorDiv.textContent = 'Número de tarjeta inválido';
                    return;
                }
                
                if (cardName.length < 2) {
                    errorDiv.textContent = 'Nombre del titular requerido';
                    return;
                }
                
                if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                    errorDiv.textContent = 'Formato de vencimiento inválido (MM/AA)';
                    return;
                }
                
                if (cardCvv.length < 3) {
                    errorDiv.textContent = 'CVV inválido';
                    return;
                }
                
                // Verificar que la tarjeta no esté vencida
                const [month, year] = cardExpiry.split('/');
                const expDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
                const now = new Date();
                
                if (expDate < now) {
                    errorDiv.textContent = 'Tarjeta vencida';
                    return;
                }
                
                // Iniciar el procesamiento del pago
                payButton.disabled = true;
                payButton.textContent = '🔄 Procesando pago seguro...';
                
                // Esperar un momento para simular el banco
                setTimeout(() => {
                    // Enviar los datos al servidor
                    // En un sistema real iría encriptado
                    const paymentData = {
                        token: '${token}',
                        card_number: cardNumber,
                        card_name: cardName,
                        card_expiry: cardExpiry,
                        card_cvv: cardCvv
                    };
                    
                    fetch('/process-payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(paymentData)
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            window.location.href = '${transaction.return_url}?token=${token}';
                        } else {
                            // Mostrar por qué falló el pago
                            errorDiv.textContent = result.message || 'Error procesando el pago';
                            payButton.disabled = false;
                            payButton.textContent = '🔒 Pagar $${transaction.amount.toLocaleString('es-CL')}';
                        }
                    })
                    .catch(error => {
                        errorDiv.textContent = 'Error de conexión. Intente nuevamente.';
                        payButton.disabled = false;
                        payButton.textContent = '🔒 Pagar $${transaction.amount.toLocaleString('es-CL')}';
                    });
                }, 2000);
            }
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

// Procesa el pago con los datos de la tarjeta
// Decide si aprobar o rechazar según las reglas
app.post('/process-payment', (req, res) => {
    const { token, card_number, card_name, card_expiry, card_cvv } = req.body;
    
    if (!token || !transactions[token]) {
        return res.status(404).json({
            success: false,
            message: 'Transacción no encontrada'
        });
    }
    
    const transaction = transactions[token];
    
    if (transaction.status !== 'CREATED') {
        return res.status(400).json({
            success: false,
            message: 'Transacción ya procesada'
        });
    }
    
    // Evaluar si se aprueba o rechaza el pago
    const paymentResult = determinePaymentResult(card_number, card_cvv, transaction.amount);
    
    // Guardar información del procesamiento
    transaction.card_last_four = card_number.replace(/\s/g, '').slice(-4);
    transaction.card_type = getCardType(card_number);
    transaction.processed_at = new Date().toISOString();
    
    if (paymentResult.status === 'AUTHORIZED') {
        transaction.status = 'AUTHORIZED';
        transaction.authorization_code = generateAuthCode();
        
        res.json({
            success: true,
            status: 'AUTHORIZED',
            authorization_code: transaction.authorization_code
        });
    } else {
        transaction.status = 'REJECTED';
        transaction.rejection_reason = paymentResult.reason;
        transaction.rejection_message = paymentResult.message;
        
        res.json({
            success: false,
            status: 'REJECTED',
            message: paymentResult.message,
            reason: paymentResult.reason
        });
    }
});

// Identifica si es Visa, MasterCard, etc.
function getCardType(cardNumber) {
    const num = cardNumber.replace(/\s/g, '');
    
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5') || num.startsWith('2')) return 'MasterCard';
    if (num.startsWith('3')) return 'American Express';
    if (num.startsWith('6')) return 'Discover';
    
    return 'Unknown';
}

// Confirma la transacción ya procesada
// Devuelve el resultado final
app.post('/commit', (req, res) => {
    const { token } = req.body;
    
    if (!token || !transactions[token]) {
        return res.status(404).json({
            error: 'Transacción no encontrada'
        });
    }
    
    const transaction = transactions[token];
    
    // Revisar qué pasó con el pago
    if (transaction.status === 'AUTHORIZED') {
        // El pago ya fue aprobado, enviar datos
        res.json({
            status: 'AUTHORIZED',
            amount: transaction.amount,
            authorization_code: transaction.authorization_code,
            buy_order: transaction.buy_order,
            card_type: transaction.card_type,
            card_last_four: transaction.card_last_four
        });
    } else if (transaction.status === 'REJECTED') {
        // El pago fue rechazado, informar el motivo
        res.status(400).json({
            status: 'REJECTED',
            error: transaction.rejection_message,
            reason: transaction.rejection_reason,
            buy_order: transaction.buy_order
        });
    } else {
        // Todavía no se ha procesado el pago
        res.status(400).json({
            error: 'Transacción no ha sido procesada'
        });
    }
});

// Consulta el estado actual de una transacción
// Permite verificar si está pendiente, aprobada o rechazada
app.get('/status', (req, res) => {
    const { token } = req.query;
    
    if (!token || !transactions[token]) {
        return res.status(404).json({
            error: 'Transacción no encontrada'
        });
    }
    
    const transaction = transactions[token];
    
    res.json({
        token: transaction.token,
        status: transaction.status,
        amount: transaction.amount,
        buy_order: transaction.buy_order,
        authorization_code: transaction.authorization_code,
        created_at: transaction.created_at,
        authorized_at: transaction.authorized_at || null
    });
});

// Procesa reembolsos de pagos ya aprobados
// Devuelve dinero al cliente
app.post('/refund', (req, res) => {
    const { token, amount } = req.body;
    
    if (!token || !transactions[token]) {
        return res.status(404).json({
            error: 'Transacción no encontrada'
        });
    }
    
    const transaction = transactions[token];
    
    // Solo se puede reembolsar si el pago fue aprobado
    if (transaction.status !== 'AUTHORIZED') {
        return res.status(400).json({
            error: 'Solo se pueden reembolsar transacciones autorizadas'
        });
    }
    
    // Verificar que el monto a reembolsar sea válido
    const refundAmount = amount ? parseFloat(amount) : transaction.amount;
    
    if (refundAmount <= 0 || refundAmount > transaction.amount) {
        return res.status(400).json({
            error: 'Monto de reembolso inválido'
        });
    }
    
    // Marcar la transacción como reembolsada
    transaction.status = 'REFUNDED';
    transaction.refunded_amount = refundAmount;
    transaction.refunded_at = new Date().toISOString();
    
    res.json({
        status: 'REFUNDED',
        refunded_amount: refundAmount,
        original_amount: transaction.amount,
        authorization_code: transaction.authorization_code
    });
});

// Muestra todas las transacciones para depuración
// Solo para desarrollo, no usar en producción
app.get('/debug/transactions', (req, res) => {
    res.json({
        total_transactions: Object.keys(transactions).length,
        transactions: Object.values(transactions)
    });
});

// Captura errores del servidor
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Error interno del servidor'
    });
});

// Arrancar el servidor de la pasarela
app.listen(port, () => {
    console.log(`🏦 Pasarela de Pagos ejecutándose en http://localhost:${port}`);
    console.log('📋 Endpoints disponibles:');
    console.log('   POST /transactions - Crear nueva transacción');
    console.log('   GET  /pay - Página de pago');
    console.log('   POST /commit - Confirmar pago');
    console.log('   GET  /status - Estado de transacción');
    console.log('   POST /refund - Procesar reembolso');
});