import Button from '../ui/Button';
import Container from './Container';

export default function Navbar({ onLogout }) {
  return (
    <header className="hb-navbar">
      <Container className="hb-navbar-inner">
        <span className="hb-brand">HireBoard</span>
        <Button variant="secondary" className="w-auto px-5" onClick={onLogout}>
          Logout
        </Button>
      </Container>
    </header>
  );
}
