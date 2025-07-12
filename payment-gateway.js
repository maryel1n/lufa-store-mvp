const express = require('express');
const app = express();
const port = 3010;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Almacenamiento en memoria para las transacciones
// En producción esto debería ser una base de datos
const transactions = {};

// Función para generar tokens únicos
// Utiliza timestamp y random para garantizar unicidad
function generateToken() {
    return `TKN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Función para generar códigos de autorización
// Similar a los que usan las pasarelas reales
function generateAuthCode() {
    return Math.random().toString(36).substr(2, 10).toUpperCase();
}

// POST /transactions
// Inicializa una nueva transacción de pago
// Parámetros esperados: amount, buy_order, session_id, return_url
app.post('/transactions', (req, res) => {
    const { amount, buy_order, session_id, return_url } = req.body;
    
    // Validación básica de parámetros requeridos
    if (!amount || !buy_order || !session_id || !return_url) {
        return res.status(400).json({
            error: 'Faltan parámetros requeridos: amount, buy_order, session_id, return_url'
        });
    }
    
    // Validación del monto
    if (amount <= 0 || isNaN(amount)) {
        return res.status(400).json({
            error: 'El monto debe ser un número positivo'
        });
    }
    
    const token = generateToken();
    
    // Almacenar la transacción con estado inicial
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
    
    // Generar URL de pago con el token
    const paymentUrl = `http://localhost:${port}/pay?token=${token}`;
    
    res.json({
        token,
        url: paymentUrl
    });
});

// GET /pay
// Página de pago simulada
// Muestra formulario simple con botón para pagar
app.get('/pay', (req, res) => {
    const { token } = req.query;
    
    if (!token || !transactions[token]) {
        return res.status(404).send('<h1>Transacción no encontrada</h1>');
    }
    
    const transaction = transactions[token];
    
    // HTML simple para simular página de pago
    // En producción esto sería más elaborado
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Pasarela de Pagos - Lufa Store</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
            .payment-form { border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
            .amount { font-size: 24px; color: #2c5aa0; margin: 10px 0; }
            .btn-pay { background: #28a745; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
            .btn-pay:hover { background: #218838; }
            .order-info { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        </style>
    </head>
    <body>
        <div class="payment-form">
            <h2>Confirmar Pago</h2>
            <div class="order-info">
                <p><strong>Orden:</strong> ${transaction.buy_order}</p>
                <p><strong>Sesión:</strong> ${transaction.session_id}</p>
                <div class="amount"><strong>Monto: $${transaction.amount.toLocaleString('es-CL')}</strong></div>
            </div>
            
            <form onsubmit="processPay(event)">
                <button type="submit" class="btn-pay">Pagar Ahora</button>
            </form>
            
            <script>
                function processPay(event) {
                    event.preventDefault();
                    // Simular procesamiento
                    document.querySelector('.btn-pay').textContent = 'Procesando...';
                    document.querySelector('.btn-pay').disabled = true;
                    
                    // Esperar 2 segundos para simular procesamiento
                    setTimeout(() => {
                        window.location.href = '${transaction.return_url}?token=${token}';
                    }, 2000);
                }
            </script>
        </div>
    </body>
    </html>
    `;
    
    res.send(html);
});

// POST /commit
// Confirma el pago y autoriza la transacción
// Cambia el estado a AUTHORIZED
app.post('/commit', (req, res) => {
    const { token } = req.body;
    
    if (!token || !transactions[token]) {
        return res.status(404).json({
            error: 'Transacción no encontrada'
        });
    }
    
    const transaction = transactions[token];
    
    // Solo se puede confirmar transacciones en estado CREATED
    if (transaction.status !== 'CREATED') {
        return res.status(400).json({
            error: `No se puede confirmar transacción en estado ${transaction.status}`
        });
    }
    
    // Actualizar transacción como autorizada
    transaction.status = 'AUTHORIZED';
    transaction.authorization_code = generateAuthCode();
    transaction.authorized_at = new Date().toISOString();
    
    res.json({
        status: 'AUTHORIZED',
        amount: transaction.amount,
        authorization_code: transaction.authorization_code,
        buy_order: transaction.buy_order
    });
});

// GET /status
// Consulta el estado de una transacción
// Útil para verificar el estado actual
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

// POST /refund
// Procesa reembolsos para transacciones autorizadas
// Cambia el estado a REFUNDED
app.post('/refund', (req, res) => {
    const { token, amount } = req.body;
    
    if (!token || !transactions[token]) {
        return res.status(404).json({
            error: 'Transacción no encontrada'
        });
    }
    
    const transaction = transactions[token];
    
    // Solo se pueden reembolsar transacciones autorizadas
    if (transaction.status !== 'AUTHORIZED') {
        return res.status(400).json({
            error: 'Solo se pueden reembolsar transacciones autorizadas'
        });
    }
    
    // Validar monto de reembolso
    const refundAmount = amount ? parseFloat(amount) : transaction.amount;
    
    if (refundAmount <= 0 || refundAmount > transaction.amount) {
        return res.status(400).json({
            error: 'Monto de reembolso inválido'
        });
    }
    
    // Actualizar estado de la transacción
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

// Endpoint adicional para listar todas las transacciones (debugging)
// Útil para desarrollo y testing
app.get('/debug/transactions', (req, res) => {
    res.json({
        total_transactions: Object.keys(transactions).length,
        transactions: Object.values(transactions)
    });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Error interno del servidor'
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`🏦 Pasarela de Pagos ejecutándose en http://localhost:${port}`);
    console.log('📋 Endpoints disponibles:');
    console.log('   POST /transactions - Crear nueva transacción');
    console.log('   GET  /pay - Página de pago');
    console.log('   POST /commit - Confirmar pago');
    console.log('   GET  /status - Estado de transacción');
    console.log('   POST /refund - Procesar reembolso');
});