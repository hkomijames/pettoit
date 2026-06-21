import { Link } from "react-router";
const Footer = () => {
    return (
        <footer className="footer">
            <Link to="/about">About Us/Contact Us</Link>
            <p>&copy; 2026 Pettoit. All rights reserved.</p>
        </footer>
    )
}

export default Footer;