import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import prisma from './services/prismaClient';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true, ts: Date.now() }));

// List products with their transactions
app.get('/api/products', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({ include: { transactions: true } });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch products' });
  }
});

// Create product (with initial registration transaction)
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const { uid, name, category, batch, metadata, actor, status } = req.body;
    if (!uid || !name) return res.status(400).json({ error: 'uid and name required' });

    const product = await prisma.product.create({
      data: {
        uid,
        name,
        category: category || 'Uncategorized',
        batch: batch || undefined,
        metadata: metadata || undefined,
        currentStatus: status || 'PRODUCT_CREATED'
      }
    });

    // create initial transaction
    await prisma.transaction.create({
      data: {
        productId: product.id,
        txType: 'REGISTRATION',
        status: product.currentStatus,
        actor: actor || 'system',
        timestamp: new Date(),
        metadata: metadata || undefined
      }
    });

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to create product' });
  }
});

// Add a chain transaction (status update / refund / etc.)
app.post('/api/chain/tx', async (req: Request, res: Response) => {
  try {
    const { productUid, txType, status, actor, metadata } = req.body;
    if (!productUid || !txType) return res.status(400).json({ error: 'productUid and txType required' });

    const product = await prisma.product.findUnique({ where: { uid: productUid } });
    if (!product) return res.status(404).json({ error: 'product not found' });

    const tx = await prisma.transaction.create({
      data: {
        productId: product.id,
        txType,
        status: status || product.currentStatus,
        actor: actor || 'system',
        timestamp: new Date(),
        metadata: metadata || undefined
      }
    });

    // update product status if changed
    if (status && status !== product.currentStatus) {
      await prisma.product.update({ where: { id: product.id }, data: { currentStatus: status } });
    }

    res.status(201).json(tx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to create tx' });
  }
});

// Get product + history
app.get('/api/products/:uid', async (req: Request, res: Response) => {
  try {
    const uid = req.params.uid;
    const product = await prisma.product.findUnique({ where: { uid }, include: { transactions: true } });
    if (!product) return res.status(404).json({ error: 'not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to fetch product' });
  }
});

app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log('Connected to database');
  } catch (err) {
    console.warn('Database connection failed, make sure DATABASE_URL is set.');
  }
});
