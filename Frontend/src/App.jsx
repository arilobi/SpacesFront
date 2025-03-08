import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import NoPage from './pages/NoPage';
import Profile from './pages/Profile';
import Register from './pages/Register';
import About from './pages/About';
import ManageBooking from './pages/ManageBooking';
import { UserProvider } from './context/UserContext'; 
import { SpaceProvider } from './context/SpaceContext'; // ✅ SpaceProvider must wrap BookingProvider
import { PaymentsProvider } from './context/PaymentsContext';
import { BookingProvider } from './context/BookingContext';
import 'react-toastify/dist/ReactToastify.css';
import ManageUsers from './pages/ManageUsers';
import ManageSpace from './pages/ManageSpace';
import Spaces from "./pages/Spaces";
import StatementSpace from "./pages/StatementSpace";
import HomeSweetHome from "./pages/HomeSweetHome";
import Business from "./pages/Business";
import MyBookings from './pages/MyBookings';
import ResetPasswordForm from './pages/ResetPasswordForm';

function App() {
  return (
    <BrowserRouter>
      <UserProvider> {/* Ensure the whole app has UserProvider */}
        <SpaceProvider> {/* ✅ SpaceProvider wraps BookingProvider */}
          <BookingProvider> {/* ✅ BookingProvider is now inside SpaceProvider */}
            <PaymentsProvider>
              <Routes>
                <Route path="/" element={<Layout />}> 
                  <Route index element={<Home />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="about" element={<About />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="manage-spaces" element={<ManageSpace />} />
                  <Route path="statementspace" element={<StatementSpace />} />
                  <Route path="homesweethome" element={<HomeSweetHome />} />
                  <Route path="business" element={<Business />} />
                  <Route path="manage-bookings" element={<ManageBooking />} />
                  <Route path="manage-users" element={<ManageUsers />} />
                  <Route path="spaces" element={<Spaces />} />
                  <Route path="bookings" element={<MyBookings />} />
                  <Route path="/reset-password" element={<ResetPasswordForm />} />
                  {/* Catch-all route for 404 pages */}
                  <Route path="*" element={<NoPage />} />
                </Route>
              </Routes>
            </PaymentsProvider>
          </BookingProvider>
        </SpaceProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;