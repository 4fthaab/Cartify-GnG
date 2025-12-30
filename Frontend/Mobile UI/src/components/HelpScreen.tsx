import { ArrowLeft, Send, Bot } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useState } from 'react';

interface HelpScreenProps {
  onBack: () => void;
}

export function HelpScreen({ onBack }: HelpScreenProps) {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your SmartShop assistant. How can I help you today?", sender: 'bot', time: '10:30 AM' },
    { id: 2, text: "Where can I find organic milk?", sender: 'user', time: '10:31 AM' },
    { id: 3, text: "Organic milk is located in Aisle A3, Dairy section. Would you like me to add it to your navigation route?", sender: 'bot', time: '10:31 AM' },
  ]);

  const [newMessage, setNewMessage] = useState('');

  const quickActions = [
    'Find product location',
    'Check cart status',
    'View offers',
    'Call staff assistance',
  ];

  const sendMessage = () => {
    if (newMessage.trim()) {
      const userMsg = {
        id: Date.now(),
        text: newMessage,
        sender: 'user',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, userMsg]);
      
      // Simulate bot response
      setTimeout(() => {
        const botMsg = {
          id: Date.now() + 1,
          text: "I'm here to help! Let me check that for you...",
          sender: 'bot',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, botMsg]);
      }, 1000);
      
      setNewMessage('');
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h2 className="text-foreground">Help & Support</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-[#FF3347] rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              <div
                className={`rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-[#FF3347] text-white'
                    : 'bg-card shadow-sm'
                }`}
              >
                <p className={`text-sm ${message.sender === 'bot' ? 'text-foreground' : ''}`}>{message.text}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 px-2">
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-6 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {quickActions.map((action) => (
            <button
              key={action}
              className="flex-shrink-0 px-4 py-2 bg-card border border-border rounded-full text-sm text-foreground hover:border-[#FF3347] hover:text-[#FF3347] transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-card px-6 py-4 shadow-lg border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 border-0 bg-input-background rounded-xl h-12"
          />
          <Button
            onClick={sendMessage}
            className="bg-[#FF3347] hover:bg-[#FF5566] text-white rounded-xl w-12 h-12 p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
