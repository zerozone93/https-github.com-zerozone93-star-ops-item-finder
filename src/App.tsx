import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { DataProvider } from './context/DataContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Resources from './pages/Resources';
import MiningGuide from './pages/MiningGuide';
import Crafting from './pages/Crafting';
import WeaponsArmor from './pages/WeaponsArmor';
import ItemDetail from './pages/ItemDetail';

export default function App() {
  return (
    <BrowserRouter basename="/https-github.com-zerozone93-star-ops-item-finder/">
      <DataProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/mining" element={<MiningGuide />} />
              <Route path="/crafting" element={<Crafting />} />
              <Route path="/weapons-armor" element={<WeaponsArmor />} />
              <Route path="/item/:type/:id" element={<ItemDetail />} />
            </Routes>
          </main>
        </div>
      </DataProvider>
    </BrowserRouter>
  );
}
