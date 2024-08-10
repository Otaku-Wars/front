import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button'; 
import Image from 'react-bootstrap/Image'; 
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { HowToModal } from './ModalHowTo'; // Importing the HowToModal component
import { useState } from 'react'; // Import useState for modal handling

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
            <Navbar expand="lg" className="nav-custom">
                <Container>
                    <Navbar.Brand href="/" className="d-flex align-items-center">
                        <Image
                            src="https://cdn.discordapp.com/attachments/1264677515239358505/1270843771713617920/gb.gif?ex=66b7273e&is=66b5d5be&hm=cc83d0edd82b04ebadd3d3c26b023687f90434fa546b879d9b51964b7048a84c&" 
                            alt="MemeClash.Tv Logo"
                            className="logo-custom"
                        />
                        <span className="ms-2 brand-text-custom">MemeClash.Tv</span>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                        <Nav.Link as="button" className="nav-link-custom" onClick={handleHowToModalShow}>
                            How It Works
                        </Nav.Link>
                        <Nav.Link href="#discord" className="nav-link-custom">Discord</Nav.Link>
                        {authenticated && (
                            <Button 
                                variant="warning" 
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
