import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import './Modal.css';

export const DefaultModal = ({ show, handleClose, title, children }: { show: boolean, handleClose: () => void, title: string, children: React.ReactNode }) => {
    return (
        <Modal 
            show={show} 
            onHide={handleClose}
            className='custom-modal-content'
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {children}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
