import { type FC } from 'react';
import Button from '../components/Button';

const DashboardPage: FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel główny</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-gray-700">Produkty w magazynie</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-gray-700">Kategorie</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-gray-700">Transakcje dzisiaj</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-gray-700">Aktywni użytkownicy</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>
      
      <div className="mt-8">
        <Button variant="primary" onClick={() => console.log('Dodaj nowy produkt')}>
          Dodaj nowy produkt
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;