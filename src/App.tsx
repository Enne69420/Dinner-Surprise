'use client';

import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import { Schema } from '../amplify/data/resource';

// Configure Amplify with the API details from environment variables
Amplify.configure({
  // Config must match the expected structure for Amplify
  API: {
    GraphQL: {
      endpoint: process.env.NEXT_PUBLIC_AMPLIFY_API_ENDPOINT || '',
      region: process.env.NEXT_PUBLIC_AMPLIFY_REGION || 'us-east-1',
      // Use string literal for auth mode
      defaultAuthMode: 'apiKey' as const,
      apiKey: process.env.NEXT_PUBLIC_AMPLIFY_API_KEY || ''
    }
  }
});

// Create type-safe clients
const apiClient = generateClient<Schema>();
const supabase = createSupabaseClient();

interface TodoItem {
  id: string;
  content: string;
  isDone: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  userId: string;
}

interface User {
  id: string;
  email: string;
}

function App() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [content, setContent] = useState('');
  const [apiResult, setApiResult] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check for authenticated user on load
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user ? { id: user.id, email: user.email || '' } : null);
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);
  
  // Load todos when user is authenticated
  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);
  
  async function fetchTodos() {
    if (!user) return;
    
    try {
      const todoData = await apiClient.models.Todo.list({
        filter: { userId: { eq: user.id } }
      });
      setTodos(todoData.data);
    } catch (err) {
      console.error('Error fetching todos:', err);
    }
  }
  
  async function createTodo() {
    if (!content || !user) return;
    
    try {
      await apiClient.models.Todo.create({
        content,
        isDone: false,
        priority: 'MEDIUM',
        userId: user.id
      });
      
      setContent('');
      fetchTodos();
    } catch (err) {
      console.error('Error creating todo:', err);
    }
  }
  
  async function callApi() {
    try {
      // Call the API function
      const response = await apiClient.queries.apiCall({
        query: 'example-query'
      });
      
      // Parse the response string to display
      setApiResult(typeof response === 'string' ? response : 'No response');
    } catch (err) {
      console.error('Error calling API:', err);
      setApiResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
  
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setTodos([]);
  }
  
  async function signIn() {
    // For this example, redirect to the login page or open a modal
    // This would be handled by your Supabase auth UI
    window.location.href = '/auth/login';
  }
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">
          {user ? `${user.email}'s Todos` : 'Todo App'}
        </h1>
        
        {user ? (
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
            onClick={signOut}
          >
            Sign Out
          </button>
        ) : (
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={signIn}
          >
            Sign In
          </button>
        )}
      </header>
      
      {user && (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 px-3 py-2 border rounded"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a todo"
              />
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={createTodo}
              >
                Add Todo
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <button 
              className="px-4 py-2 bg-purple-600 text-white rounded"
              onClick={callApi}
            >
              Call API
            </button>
            {apiResult && (
              <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
                {apiResult}
              </pre>
            )}
          </div>
          
          <ul className="space-y-2">
            {todos.map((todo) => (
              <li 
                key={todo.id} 
                className="p-4 border rounded flex items-center justify-between"
              >
                <span>
                  {todo.content} - <span className="text-sm text-gray-500">Priority: {todo.priority}</span>
                </span>
              </li>
            ))}
            {todos.length === 0 && <p>No todos yet. Add some above!</p>}
          </ul>
        </>
      )}
    </div>
  );
}

export default App; 