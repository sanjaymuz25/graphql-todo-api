const {ApolloServer ,gql} = require('apollo-server');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'todos.json');

const readTodos = () => {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
};

const writeTodos = (todos) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

const typeDefs = gql`
    type Todo {
        id: ID!
        task: String!
        completed: Boolean!
    }

    type Query {
        getTodos: [Todo!]
        getTodo(id: ID!): Todo
    }

    type Mutation {
        addTodo(task: String!): Todo!
        toggleTodo(id: ID!): Todo
        deleteTodo(id: ID!): String
    }
`

const resolvers = {
    Query: {
        getTodos: (_, __, context) => { 
            console.log(context);
            if (!context.user) {
                throw new Error('Unauthorized');
            }
            return readTodos();
        },
        getTodo: (_, { id }, context) => {
            if (!context.user) {
                throw new Error('Unauthorized');
            }
            return readTodos().find(t => t.id === id);
        }
    },
    Mutation: {
        addTodo: (_, {task}) => {
            const todos = readTodos();
            const newTodo = {
                id: Date.now().toString(),
                task,
                completed: false
            }
            todos.push(newTodo);
            writeTodos(todos);
            return newTodo;
        },
        toggleTodo: (_, {id}) => {
            const todos = readTodos();
            const todo = todos.find(t => t.id === id);
            if (todo) {
                todo.completed = !todo.completed;
                writeTodos(todos);
            }
            return todo;
        },
        deleteTodo: (_, {id}) => {
            const todos = readTodos();
            todos = todos.filter(t => t.id !== id);
            writeTodos(todos);
            return `Todo with id ${id} deleted.`;
        }
    }
}

const server = new ApolloServer({typeDefs, resolvers, context: ({req}) => {
    const token  = req.headers.authorization  || '';    
    if (token == 'secret') {
        return {user: {name: "Sanjay Sharma"}};
    }
    return {}
}});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});