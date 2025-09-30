// Importa o Express, Mongoose e CORS
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mude esta string por uma complexa e armazene-a como variável de ambiente (process.env.JWT_SECRET)
const JWT_SECRET = 'seu-segredo-super-secreto'; 

const app = express();
// A variável de ambiente do Render é acessada diretamente.
const PORT = process.env.PORT || 3000;

// Configuração CORS Aprimorada
// --- ADICIONAR OU VERIFICAR ESTE BLOCO ---
app.use(cors({
    origin: '*', // Permite todas as origens
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permite os métodos essenciais
    allowedHeaders: ['Content-Type', 'Authorization'] // Permite os cabeçalhos usados (JSON e Token)
}));
// ------------------------------------------

app.use(express.json());

// Conexão com o banco de dados MongoDB
// É altamente recomendado armazenar o MONGODB_URI como uma variável de ambiente no Render!
const MONGODB_URI = 'mongodb+srv://hudsonrene96_db_user:yB4q8kGUEJHUtOmW@cluster0.vir5iqs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Conectado ao MongoDB!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Esquema do Mongoose para o modelo de Usuário
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Modelo de Usuário
const User = mongoose.model('User', userSchema);

// Esquema do Mongoose para o modelo de Tarefa
const taskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    category: { type: String, required: false },
    dueDate: { type: Date, required: false } // Adicionamos a nova propriedade de prazo
});

// Modelo de Tarefa
const Task = mongoose.model('Task', taskSchema);

// Middleware para proteger rotas
const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        // Logar o erro, mas enviar apenas uma mensagem genérica para o frontend por segurança
        console.error('Erro de autenticação:', err.message); 
        res.status(401).send('Autenticação necessária. Token inválido ou expirado.');
    }
};

// --- Rotas de Autenticação ---

// Rota POST: Registrar um novo usuário
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validação básica
        if (!username || !password) {
            return res.status(400).send('Nome de usuário e senha são obrigatórios.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).send('Usuário registrado com sucesso!');
    } catch (error) {
        // Erro 11000 é geralmente de duplicação de chave única (username já existe)
        if (error.code === 11000) {
            return res.status(400).send('Nome de usuário já está em uso.');
        }
        res.status(500).send('Erro interno do servidor ao registrar usuário: ' + error.message);
    }
});

// Rota POST: Fazer login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Usuário ou senha inválidos.'); // Mensagem genérica para segurança
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Usuário ou senha inválidos.'); // Mensagem genérica para segurança
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' }); // Token válido por 1 dia
        res.json({ token, userId: user._id, username: user.username });
    } catch (error) {
        res.status(500).send('Erro no servidor ao tentar login.');
    }
});

// --- Rotas de Tarefas (Protegidas) ---

// Rota GET: Listar tarefas do usuário (com ordenação por prazo e status)
app.get('/api/tarefas', auth, async (req, res) => {
    try {
        const query = { userId: req.userId };
        if (req.query.category) {
            query.category = req.query.category;
        }
        // Ordena por 'completed' (0/false vem antes de 1/true), e depois por 'dueDate' crescente.
        const tasks = await Task.find(query).sort({ completed: 1, dueDate: 1 });
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar tarefas: ' + err.message });
    }
});

// Rota POST: Criar uma nova tarefa para o usuário
app.post('/api/tarefas', auth, async (req, res) => {
    const task = new Task({
        text: req.body.text,
        userId: req.userId,
        category: req.body.category || 'Geral',
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined // Garante que é um objeto Date
    });
    try {
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao criar tarefa: ' + err.message });
    }
});

// Rota DELETE: Deletar uma tarefa do usuário
app.delete('/api/tarefas/:id', auth, async (req, res) => {
    try {
        // Verifica se o ID é um ObjectId válido antes de consultar
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de tarefa inválido.' });
        }
        const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!deletedTask) {
            return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence a este usuário.' });
        }
        res.status(200).json({ message: 'Tarefa deletada com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao deletar tarefa: ' + err.message });
    }
});

// Rota PUT: Atualizar uma tarefa do usuário
app.put('/api/tarefas/:id', auth, async (req, res) => {
    try {
        // Verifica se o ID é um ObjectId válido antes de consultar
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de tarefa inválido.' });
        }
        
        const updates = {};
        if (req.body.text !== undefined) updates.text = req.body.text;
        if (req.body.completed !== undefined) updates.completed = req.body.completed;
        if (req.body.category !== undefined) updates.category = req.body.category;
        // Se dueDate for fornecido, converte para objeto Date
        if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null; 

        const updatedTask = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updates,
            { new: true, runValidators: true } // 'runValidators' garante que as regras do Schema sejam aplicadas
        );
        
        if (!updatedTask) {
            return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence a este usuário.' });
        }
        res.status(200).json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: 'Erro ao atualizar tarefa: ' + err.message });
    }
});

// O servidor deve ser "escutado" por último, depois de todas as rotas
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    // No Render, a porta não é localhost, mas o log de inicialização é útil.
});
