/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthPages } from './components/AuthPages';
import { DashboardLayout } from './components/DashboardLayout';

function AppContent() {
  const {
    currentUser,
    users,
    products,
    userInvestments,
    deposits,
    withdrawals,
    bonusCodes,
    commissions,
    tickets,
    liveStats,
    globalNotification,
    
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    buyInvestment,
    claimDailyEarning,
    requestDeposit,
    requestWithdrawal,
    redeemBonusCode,
    claimDailyBonus,
    createSupportTicket,
    
    toggleBlockUser,
    updateUserBalance,
    processDeposit,
    processWithdrawal,
    addOrUpdateProduct,
    deleteProduct,
    generateBonusCode,
    sendGlobalNotification,
    replyToTicket
  } = useApp();

  const [navigationMode, setNavigationMode] = useState<'login' | 'register'>('register');

  // Automatically detect partner referral codes from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = 
      params.get('ref') || 
      params.get('code') || 
      params.get('parrain') || 
      params.get('refCode') || 
      params.get('referrer') ||
      params.get('inviter') ||
      params.get('invite') ||
      params.get('referral');

    if (refCode) {
      localStorage.setItem('aurainvest_ref_code', refCode);
      if (!currentUser) {
        setNavigationMode('register');
      }
    }
  }, [currentUser]);

  // Sync navigation mode when user state changes
  useEffect(() => {
    if (currentUser) {
      setNavigationMode('login'); // Handled natively by dashboard view check below
    } else {
      setNavigationMode('register'); // Always default to registration page for new/unauthenticated users
    }
  }, [currentUser]);

  // Routing conditions
  if (currentUser) {
    return (
      <DashboardLayout
        currentUser={currentUser}
        users={users}
        products={products}
        userInvestments={userInvestments}
        deposits={deposits}
        withdrawals={withdrawals}
        bonusCodes={bonusCodes}
        commissions={commissions}
        tickets={tickets}
        globalNotification={globalNotification}
        liveStats={liveStats}
        
        logout={logout}
        updateProfile={updateProfile}
        changePassword={changePassword}
        buyInvestment={buyInvestment}
        claimDailyEarning={claimDailyEarning}
        requestDeposit={requestDeposit}
        requestWithdrawal={requestWithdrawal}
        redeemBonusCode={redeemBonusCode}
        claimDailyBonus={claimDailyBonus}
        createSupportTicket={createSupportTicket}
        
        toggleBlockUser={toggleBlockUser}
        updateUserBalance={updateUserBalance}
        processDeposit={processDeposit}
        processWithdrawal={processWithdrawal}
        addOrUpdateProduct={addOrUpdateProduct}
        deleteProduct={deleteProduct}
        generateBonusCode={generateBonusCode}
        sendGlobalNotification={sendGlobalNotification}
        replyToTicket={replyToTicket}
      />
    );
  }

  // Auth Pages rendering (Login / Register) when unauthenticated
  return (
    <AuthPages
      initialMode={navigationMode}
      onBackToLanding={() => setNavigationMode('login')}
      onSuccess={() => setNavigationMode('login')}
      authActions={{
        login,
        register
      }}
    />
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
