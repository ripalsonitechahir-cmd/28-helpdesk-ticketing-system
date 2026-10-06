import { Route, Routes } from 'react-router-dom';
import { RequireAgent } from './auth';
import Layout from './components/Layout';
import Board from './pages/Board';
import Login from './pages/Login';
import Lookup from './pages/Lookup';
import SubmitTicket from './pages/SubmitTicket';
import TicketDetail from './pages/TicketDetail';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SubmitTicket />} />
        <Route path="lookup" element={<Lookup />} />
        <Route path="login" element={<Login />} />
        <Route path="ticket/:id" element={<TicketDetail />} />
        <Route path="board" element={<RequireAgent><Board /></RequireAgent>} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Route>
    </Routes>
  );
}
