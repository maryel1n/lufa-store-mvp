import express from 'express';
const app = express();
const port = 3010;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Versión simplificada - no necesitamos almacenar transacciones
// Solo generamos tokens para el efecto visual

// Solo necesitamos generar tokens para la demo - no validaciones complejas

// Crea tokens únicos para cada transacción
// Combina fecha y números aleatorios
function generateToken() {
    return `TKN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Función eliminada - no necesitamos códigos de autorización para la demo

// Endpoint para crear una nueva transacción
// Solo genera un token y URL para el efecto visual
app.post('/transactions', (req, res) => {
    const { amount, return_url } = req.body;
    
    // Usar valores por defecto si no vienen
    const finalAmount = amount || 25000;
    const finalReturnUrl = return_url || 'http://localhost:3000/payment-return';
    
    // Solo generar token para la demo
    const token = generateToken();
    const paymentUrl = `http://localhost:${port}/pay?token=${token}&amount=${finalAmount}&return_url=${encodeURIComponent(finalReturnUrl)}`;
    
    res.json({
        token,
        url: paymentUrl
    });
});

// Muestra la página de pago al usuario
// Formulario con campos de tarjeta de crédito
app.get('/pay', (req, res) => {
    const { token, amount, return_url } = req.query;
    
    // Para demostración: generar token si no existe
    const finalToken = token || `DEMO_${Date.now()}`;
    
    // Usar parámetros de la URL en lugar de transactions
    const displayAmount = amount || '25000';
    const returnUrl = return_url || 'http://localhost:3000/payment-return';
    
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
                    <p><strong>Token:</strong> ${finalToken}</p>
                    <div class="amount"><strong>Total: $${parseInt(displayAmount).toLocaleString('es-CL')}</strong></div>
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
                        <small style="color: #856404; margin-top: 10px; display: block;">
                            Para efec tos de esta demo no se está validando ningún dato. Siempre retornaremos pago exitoso.
                        </small>
                    </div>
                    
                    <button type="submit" class="btn-pay" id="pay-button">
                        🔒 Pagar $${parseInt(displayAmount).toLocaleString('es-CL')}
                    </button>
                </form>
            </div>
        </div>
        
        <script>
            // Variables del servidor para uso en cliente
            const returnUrl = '${returnUrl}';
            const finalToken = '${finalToken}';
            
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
                
                // Ir directo al return inmediatamente sin validaciones
                window.location.href = returnUrl + '?token=' + finalToken + '&status=approved';
            }
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

// Endpoints simplificados eliminados - solo necesitamos /transactions y /pay para la demo

// Captura errores del servidor
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        error: 'Error interno del servidor'
    });
});

// Arrancar el servidor de la pasarela
app.listen(port, () => {
    console.log(`🏦 Pasarela de Pagos DEMO ejecutándose en http://localhost:${port}`);
    console.log('📋 Endpoints disponibles:');
    console.log('   POST /transactions - Crear token para demo');
    console.log('   GET  /pay - Página de pago simplificada');
    console.log('💡 Versión ultra-simplificada solo para demostración');
});