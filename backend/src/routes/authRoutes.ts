import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'tripledger_super_secret_jwt_key_2026';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, upiId } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        upiId: upiId || `${name.toLowerCase().replace(/\s+/g, '')}@upi`,
        avatarUrl
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, upiId: user.upiId, avatarUrl: user.avatarUrl },
      token
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, upiId: user.upiId, avatarUrl: user.avatarUrl },
      token
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Current User Profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, upiId: true, avatarUrl: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Profile (UPI ID)
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { upiId, name } = req.body;
    if (!upiId) return res.status(400).json({ error: 'UPI ID is required' });

    // Validate UPI ID format
    const upiRegex = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId.trim())) {
      return res.status(400).json({ error: 'Invalid UPI ID format (e.g. username@upi)' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        upiId: upiId.trim(),
        ...(name ? { name: name.trim() } : {})
      },
      select: { id: true, name: true, email: true, upiId: true, avatarUrl: true }
    });

    return res.json({ user: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

export default router;

