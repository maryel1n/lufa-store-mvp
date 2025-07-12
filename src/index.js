import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

//Catálogo de productos hardcodeado con stock
let productos = [
    { id: 1, nombre: "Polera Blanca", precio: 299990, stock: 100, imagen: "producto1.png", descripcion: "Polera Blanca" },
    { id: 2, nombre: "Polera Negra", precio: 899990, stock: 100, imagen: "producto2.png", descripcion: "Polera Negra" },
    { id: 3, nombre: "Polera Azul", precio: 89990, stock: 100, imagen: "producto3.png", descripcion: "Polera Azul" },
    { id: 4, nombre: "Tablet Pro 12", precio: 459990, stock: 100, imagen: "producto1.png", descripcion: "Tablet profesional con stylus incluido" },
    { id: 5, nombre: "Smartwatch Sport", precio: 199990, stock: 100, imagen: "producto2.png", descripcion: "Reloj inteligente deportivo resistente al agua" },
    { id: 6, nombre: "Cámara Mirrorless", precio: 649990, stock: 100, imagen: "producto3.png", descripcion: "Cámara profesional sin espejo 24MP" },
    { id: 7, nombre: "Monitor 4K Ultra", precio: 349990, stock: 100, imagen: "producto1.png", descripcion: "Monitor 4K de 27 pulgadas para profesionales" },
    { id: 8, nombre: "Teclado Mecánico RGB", precio: 129990, stock: 100, imagen: "producto2.png", descripcion: "Teclado mecánico para gaming con retroiluminación" }
];

// Productos destacados SOLO para la página de inicio
const destacados = [
    {
        nombre: "Detergente Eco",
        imagen: "detergente.png",
        precio: 5000
    },
    {
        nombre: "Lavalozas",
        imagen: "lavalozas.png",
        precio: 4200
    },
    {
        nombre: "Limpiador Multiuso",
        imagen: "multiuso.png",
        precio: 4500
    }
];
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

app.use(session({
    secret: 'carrito-mvp-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Nueva ruta para la página de inicio con productos destacados
app.get('/', (req, res) => {
    res.render('index', {
        destacados,
        title: 'Lufa Store - Inicio'
    });
});

app.get('/catalogo', (req, res) => {
    res.render('catalogo', { title: 'Catálogo de Productos', productos: productos });
});
app.get('/carrito', (req, res) => {
    res.render('carrito', { title: 'Carrito de Compras' });
});
app.get('/checkout', (req, res) => {
    res.render('checkout', { title: 'Checkout' });
});
app.get('/confirmacion', (req, res) => {
    res.render('confirmacion', { title: 'Confirmación de compra' });
});

// API endpoints para productos
app.get('/api/productos', (req, res) => {
    res.json(productos);
});

// API endpoints para el carrito
app.get('/api/carrito', (req, res) => {
    const carrito = req.session.carrito || [];
    res.json(carrito);
});

app.post('/api/carrito/agregar', (req, res) => {
    const { id, nombre, precio } = req.body;
    
    // Verificar stock disponible
    const producto = productos.find(p => p.id === id);
    if (!producto) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    if (!req.session.carrito) {
        req.session.carrito = [];
    }
    
    const productoEnCarrito = req.session.carrito.find(p => p.id === id);
    const cantidadEnCarrito = productoEnCarrito ? productoEnCarrito.cantidad : 0;
    
    if (cantidadEnCarrito >= producto.stock) {
        return res.status(400).json({ success: false, message: 'Stock insuficiente' });
    }
    
    if (productoEnCarrito) {
        productoEnCarrito.cantidad++;
    } else {
        req.session.carrito.push({
            id: id,
            nombre: nombre,
            precio: precio,
            imagen: producto.imagen,
            cantidad: 1
        });
    }
    
    res.json({ success: true, carrito: req.session.carrito });
});

app.put('/api/carrito/actualizar/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { cantidad } = req.body;
    
    if (!req.session.carrito) {
        req.session.carrito = [];
    }
    
    // Verificar stock disponible
    const productoCatalogo = productos.find(p => p.id === id);
    if (!productoCatalogo) {
        return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    if (cantidad > productoCatalogo.stock) {
        return res.status(400).json({ success: false, message: 'Stock insuficiente' });
    }
    
    const producto = req.session.carrito.find(p => p.id === id);
    if (producto && cantidad > 0) {
        producto.cantidad = cantidad;
    }
    
    res.json({ success: true, carrito: req.session.carrito });
});

app.delete('/api/carrito/eliminar/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (!req.session.carrito) {
        req.session.carrito = [];
    }
    
    req.session.carrito = req.session.carrito.filter(p => p.id !== id);
    
    res.json({ success: true, carrito: req.session.carrito });
});

app.post('/api/carrito/limpiar', (req, res) => {
    req.session.carrito = [];
    res.json({ success: true, carrito: [] });
});

// Endpoint para procesar compra y descontar stock
app.post('/api/comprar', async (req, res) => {
    if (!req.session.carrito || req.session.carrito.length === 0) {
        return res.status(400).json({ success: false, message: 'Carrito vacío' });
    }
    
    // Verificar stock suficiente para todos los productos
    for (const item of req.session.carrito) {
        const producto = productos.find(p => p.id === item.id);
        if (!producto || producto.stock < item.cantidad) {
            return res.status(400).json({ 
                success: false, 
                message: `Stock insuficiente para ${item.nombre}` 
            });
        }
    }
    
    // Calcular total del carrito
    const total = req.session.carrito.reduce((sum, item) => {
        const producto = productos.find(p => p.id === item.id);
        return sum + (producto.precio * item.cantidad);
    }, 0);
    
    try {
        // Crear transacción en la pasarela de pagos
        const paymentData = {
            amount: total,
            buy_order: `LUFA_${Date.now()}`,
            session_id: req.sessionID,
            return_url: `http://localhost:3000/payment-return`
        };
        
        const response = await fetch('http://localhost:3010/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
            throw new Error('Error creando transacción en pasarela');
        }
        
        const paymentResponse = await response.json();
        
        // Guardar información de la transacción en la sesión
        req.session.pendingPayment = {
            token: paymentResponse.token,
            amount: total,
            buy_order: paymentData.buy_order,
            carrito: [...req.session.carrito] // Copia del carrito para procesar después
        };
        
        res.json({ 
            success: true, 
            redirect_url: paymentResponse.url,
            token: paymentResponse.token
        });
        
    } catch (error) {
        console.error('Error procesando pago:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error conectando con la pasarela de pagos' 
        });
    }
});

// Endpoint para manejar el retorno de la pasarela de pagos
app.get('/payment-return', async (req, res) => {
    const { token } = req.query;
    
    if (!token || !req.session.pendingPayment || req.session.pendingPayment.token !== token) {
        return res.redirect('/checkout?error=invalid_payment');
    }
    
    try {
        // Confirmar el pago en la pasarela
        const commitResponse = await fetch('http://localhost:3010/commit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        
        if (!commitResponse.ok) {
            throw new Error('Error confirmando pago');
        }
        
        const paymentResult = await commitResponse.json();
        
        if (paymentResult.status === 'AUTHORIZED') {
            // Procesar la compra: descontar stock
            const carrito = req.session.pendingPayment.carrito;
            
            for (const item of carrito) {
                const producto = productos.find(p => p.id === item.id);
                if (producto) {
                    producto.stock -= item.cantidad;
                }
            }
            
            // Guardar información del pago exitoso
            req.session.lastPayment = {
                success: true,
                amount: req.session.pendingPayment.amount,
                buy_order: req.session.pendingPayment.buy_order,
                authorization_code: paymentResult.authorization_code,
                token: token
            };
            
            // Limpiar carrito y pago pendiente
            req.session.carrito = [];
            delete req.session.pendingPayment;
            
            res.redirect('/confirmacion');
        } else {
            throw new Error('Pago no autorizado');
        }
        
    } catch (error) {
        console.error('Error procesando retorno de pago:', error);
        
        // Guardar información del pago fallido
        req.session.lastPayment = {
            success: false,
            error: 'Error procesando el pago'
        };
        
        // Mantener el pago pendiente para reintentar
        res.redirect('/confirmacion');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});