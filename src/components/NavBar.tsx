import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button'; 
import Image from 'react-bootstrap/Image'; 
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { HowToModal } from './ModalHowTo'; // Importing the HowToModal component
import { useState } from 'react'; // Import useState for modal handling
import './NavBar.css';

export const truncateWallet = (wallet: string) => {
    if (!wallet) {
        return '';
    }
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
};

export const NavBar = () => {
    const { wallets } = useWallets();
    const { login, authenticated } = usePrivy();
    const address = wallets[0]?.address ?? '';
    const navigate = useNavigate();

    // State to handle HowToModal visibility
    const [showHowToModal, setShowHowToModal] = useState(false);
    const handleHowToModalClose = () => setShowHowToModal(false);
    const handleHowToModalShow = () => setShowHowToModal(true);

    return (
        <>
            <Navbar className="nav-custom">
                <Container fluid>
                    <Navbar.Brand href="/" className="d-flex align-items-center">
                        <Image
                            src="/logo.png"
                            height={"25px"}
                            alt="MemeClash.Tv Logo"
                        />
                        {/* <span className="ms-2 brand-text-custom">MemeClash<span className="tv-symbol">.Tv</span></span> */}
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end gap-5">
                        <Nav.Link as="button" className="nav-link-custom" onClick={handleHowToModalShow}>
                            How It Works
                        </Nav.Link>
                        <Nav.Link 
                            href="https://discord.gg/uUdQZXXBPf" 
                            className="nav-link-custom"
                            target='_blank'
                        >
                            Chat
                        </Nav.Link>
                        {authenticated && (
                            <Button 
                                variant="warning" 
                                style={{ paddingLeft: '40px', paddingRight: '40px' }} // Custom padding via inline styles
                                className="login-btn-custom"
                                onClick={() => {
                                    navigate(`/user/${address}`);
                                }}
                            >
                                {truncateWallet(address)}   
                            </Button>
                        )}
                        {!authenticated && (
                            <Button 
                                variant="warning" 
                                style={{ paddingLeft: '40px', paddingRight: '40px' }} // Custom padding via inline styles
                                className="login-btn-custom"
                                onClick={login}
                            >
                                Log in / Sign up
                            </Button>
                        )}
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            
            {/* HowToModal Component */}
            <HowToModal show={showHowToModal} handleClose={handleHowToModalClose} />
        </>
    );
};
