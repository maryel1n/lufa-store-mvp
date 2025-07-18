import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configurar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || ***REMOVED***);

//Catálogo de productos hardcodeado con stock
let productos = [
    {
        id: 1,
        nombre: "Detergente Eco",
        precio: 5000,
        stock: 100,
        imagen: "detergente.png",
        descripcion: "Detergente ecológico de 500ml en envase retornable"
    },
    {
        id: 2,
        nombre: "Lavalozas",
        precio: 4500,
        stock: 100,
        imagen: "lavalozas.png",
        descripcion: "Lavalozas biodegradable de 500ml en envase retornable"
    },
    {
        id: 3,
        nombre: "Limpiador Multiuso",
        precio: 3800,
        stock: 100,
        imagen: "multiuso.png",
        descripcion: "Limpiador multiuso de 300ml en envase retornable"
    },
    {
        id: 4,
        nombre: "Desinfectante 2L",
        precio: 7200,
        stock: 50,
        imagen: "desinfectante.png",
        descripcion: "Desinfectante ecológico para superficies, en envase de 2 litros retornable"
    },
    {
        id: 5,
        nombre: "Suavizante Natural",
        precio: 5200,
        stock: 80,
        imagen: "suavizante.png",
        descripcion: "Suavizante de ropa con fragancia natural, envase retornable"
    },
    {
        id: 6,
        nombre: "Limpia Vidrios Eco",
        precio: 4000,
        stock: 100,
        imagen: "vidrios.png",
        descripcion: "Limpiador ecológico para vidrios, envase retornable"
    },
    {
        id: 7,
        nombre: "Jabón Líquido Eco",
        precio: 3900,
        stock: 90,
        imagen: "jabon.png",
        descripcion: "Jabón líquido de manos ecológico, suave con la piel y el planeta"
    },
    {
        id: 8,
        nombre: "Pack Familiar Eco",
        precio: 18990,
        stock: 40,
        imagen: "pack.png",
        descripcion: "Pack ahorro con detergente, lavalozas y multiuso en envases retornables"
    }
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
    secret: process.env.SESSION_SECRET || 'carrito-mvp-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 horas
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
    res.render('confirmacion', {
        title: 'Confirmación de compra',
        session: req.session
    });
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

// Endpoint para procesar compra con Stripe
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
        // Crear sesión de pago con Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: req.session.carrito.map(item => {
                const producto = productos.find(p => p.id === item.id);
                return {
                    price_data: {
                        currency: 'clp',
                        product_data: {
                            name: item.nombre,
                            description: producto.descripcion
                        },
                        unit_amount: producto.precio
                    },
                    quantity: item.cantidad
                };
            }),
            mode: 'payment',
            success_url: `${process.env.BASE_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL || 'http://localhost:3000'}/checkout?cancelled=true`,
            metadata: {
                buy_order: `LUFA_${Date.now()}`,
                session_id: req.sessionID
            }
        });
        
        // Guardar información de la transacción pendiente
        req.session.pendingPayment = {
            stripe_session_id: session.id,
            amount: total,
            buy_order: `LUFA_${Date.now()}`,
            carrito: [...req.session.carrito]
        };
        
        res.json({ 
            success: true, 
            redirect_url: session.url,
            session_id: session.id
        });
        
    } catch (error) {
        console.error('Error creando sesión de Stripe:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error procesando el pago' 
        });
    }
});

// Endpoint para manejar el éxito del pago con Stripe
app.get('/payment-success', async (req, res) => {
    const { session_id } = req.query;
    
    if (!session_id) {
        return res.redirect('/checkout?error=no_session');
    }
    
    try {
        // Recuperar la sesión de Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        if (session.payment_status === 'paid') {
            // Procesar carrito si existe
            if (req.session.pendingPayment && req.session.pendingPayment.carrito) {
                const carrito = req.session.pendingPayment.carrito;
                
                // Descontar stock
                for (const item of carrito) {
                    const producto = productos.find(p => p.id === item.id);
                    if (producto) {
                        producto.stock -= item.cantidad;
                    }
                }
                
                // Limpiar carrito
                req.session.carrito = [];
            }

            // Guardar datos del pago exitoso
            req.session.lastPayment = {
                success: true,
                amount: req.session.pendingPayment ? req.session.pendingPayment.amount : session.amount_total / 100,
                buy_order: session.metadata.buy_order,
                payment_intent: session.payment_intent,
                session_id: session_id,
                payment_method: 'Stripe'
            };

            // Limpiar pago pendiente
            delete req.session.pendingPayment;

        } else {
            req.session.lastPayment = {
                success: false,
                error: 'Pago no completado'
            };
        }
        
    } catch (error) {
        console.error('Error verificando pago:', error);
        req.session.lastPayment = {
            success: false,
            error: 'Error verificando el pago'
        };
    }

    res.redirect('/confirmacion');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});