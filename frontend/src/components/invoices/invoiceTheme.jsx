import React from 'react';

// Demo ERP brand palette — sampled from logo-alternate.png + approved invoice reference
export const BRAND = {
  orange: '#E67E22',      // "Smart" in logo
  orangeLight: '#F39C12',
  teal: '#13B5A6',        // "Plaza" + primary invoice accent
  tealDark: '#0E9A8E',
  ink: '#1E293B',
  gray: '#64748B',
  lightGray: '#F8FAFC',
  border: '#E2E8F0',
  rowAlt: '#F0FDFA',      // subtle teal tint for zebra rows
};

export const PhoneIcon = ({ color = '#fff', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M6.6 10.8c1.4 2.8 3.7 5.1 6.5 6.5l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1.1.5 1.1 1.1V20c0 .6-.5 1.1-1.1 1.1C10.6 21.1 2.9 13.4 2.9 3.9 2.9 3.3 3.4 2.8 4 2.8h3.4c.6 0 1.1.5 1.1 1.1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1.1L6.6 10.8z" />
  </svg>
);

export const MailIcon = ({ color = '#fff', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M2 6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6zm2 0l8 6 8-6H4zm0 2.4V18h16V8.4l-8 6-8-6z" />
  </svg>
);

export const PinIcon = ({ color = '#fff', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 6.6 11.1 7.3 11.7.4.4 1 .4 1.4 0C13.4 21.1 20 15.4 20 10c0-4.4-3.6-8-8-8zm0 10.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 7.5 12 7.5s2.5 1.1 2.5 2.5S13.4 12.5 12 12.5z" />
  </svg>
);
