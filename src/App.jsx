import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Navbar from "./layouts/Navbar";
import BookingForm from "./components/BookingForm";
import AdminPanel from "./components/AdminPanel";
import ClientPortal from "./components/ClientPortal";
import Footer from "./layouts/Footer";
import "./index.css";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppContent = () => {
  const { pathname } = useLocation();
  const isAdminRoute = pathname === "/admin";
  const isBookingExperience = pathname === "/" || pathname === "/reservar" || pathname === "/portal";

  return (
    <>
      <Navbar />
      <div
        className={`main-content ${isAdminRoute ? "admin-page-content" : ""} ${
          isBookingExperience ? "immersive-page-content" : ""
        }`}
      >
        <Routes>
          <Route path="/" element={<BookingForm />} />
          <Route path="/reservar" element={<BookingForm />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/portal" element={<ClientPortal />} />
        </Routes>
      </div>
      {!isAdminRoute && <Footer />}
    </>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
