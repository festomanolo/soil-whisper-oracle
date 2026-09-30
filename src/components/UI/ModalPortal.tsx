import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

const ModalPortal: React.FC<ModalPortalProps> = ({ children, isOpen }) => {
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    // Create a div that will be positioned at the root level of the DOM
    let modalRootElement = document.getElementById('modal-root');
    
    if (!modalRootElement) {
      modalRootElement = document.createElement('div');
      modalRootElement.id = 'modal-root';
      modalRootElement.style.position = 'fixed';
      modalRootElement.style.top = '0';
      modalRootElement.style.left = '0';
      modalRootElement.style.width = '100%';
      modalRootElement.style.height = '100%';
      modalRootElement.style.zIndex = '9999999';
      modalRootElement.style.pointerEvents = isOpen ? 'auto' : 'none';
      document.body.appendChild(modalRootElement);
    }
    
    setModalRoot(modalRootElement);
    
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      // Restore body scrolling when component unmounts
      document.body.style.overflow = '';
      
      // Remove the modal root element if it exists and has no children
      if (modalRootElement && modalRootElement.childNodes.length === 0) {
        document.body.removeChild(modalRootElement);
      }
    };
  }, [isOpen]);
  
  if (!isOpen || !modalRoot) return null;
  
  return ReactDOM.createPortal(children, modalRoot);
};

export default ModalPortal;