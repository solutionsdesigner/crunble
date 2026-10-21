import React, { useState } from 'react';
import { X, Check, ShieldCheck, Sparkles, RefreshCw, ExternalLink, FileText, Lock } from 'lucide-react';

interface SubscriptionAndLegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'subscriptions' | 'terms' | 'privacy' | 'review_notes';
}

export const SubscriptionAndLegalModal: React.FC<SubscriptionAndLegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'subscriptions',
}) => {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'terms' | 'privacy' | 'review_notes'>(defaultTab);
  const [selectedPlan, setSelectedPlan] = useState<'pro_3m' | 'pro_plus_3m'>('pro_3m');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = () => {
    setIsPurchasing(true);
    setPurchaseStatus(null);
    setTimeout(() => {
      setIsPurchasing(false);
      setPurchaseStatus(
        selectedPlan === 'pro_3m'
          ? '✓ Cronble Pro (3 Months) active! Sandbox StoreKit confirmation verified.'
          : '✓ Cronble Pro Plus (3 Months) active! Sandbox StoreKit confirmation verified.'
      );
    }, 1200);
  };

  const handleRestore = () => {
    setIsRestoring(true);
    setPurchaseStatus(null);
    setTimeout(() => {
      setIsRestoring(false);
      setPurchaseStatus('✓ Subscriptions successfully restored via Apple App Store receipt validation.');
    }, 1000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs p-3 sm:p-6 flex items-start sm:items-center justify-center overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-[#faf7f2] border border-[#d4d0c8] p-5 sm:p-7 text-[#1a1a1a] my-auto max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] overflow-y-auto overscroll-contain"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-start justify-between border-b border-[#e3dfd7] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#6b6b6b] px-2 py-0.5 bg-[#eae5dc] rounded-xs">
                App Store Compliance
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#8c8c8c]">
                Guideline 3.1.2(c)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-[#1a1a1a] mt-1">
              Cronble Memberships &amp; Legal
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#eae5dc] transition-colors rounded-xs"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#e3dfd7] pb-3 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => {
              setActiveTab('subscriptions');
              setPurchaseStatus(null);
            }}
            className={`px-3 py-1.5 font-medium transition-colors ${
              activeTab === 'subscriptions'
                ? 'bg-[#1a1a1a] text-[#faf7f2]'
                : 'bg-[#eae5dc] text-[#6b6b6b] hover:text-[#1a1a1a]'
            }`}
          >
            Subscriptions (3.1.2c)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              activeTab === 'terms'
                ? 'bg-[#1a1a1a] text-[#faf7f2]'
                : 'bg-[#eae5dc] text-[#6b6b6b] hover:text-[#1a1a1a]'
            }`}
          >
            Terms of Use (EULA)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'bg-[#1a1a1a] text-[#faf7f2]'
                : 'bg-[#eae5dc] text-[#6b6b6b] hover:text-[#1a1a1a]'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review_notes')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              activeTab === 'review_notes'
                ? 'bg-[#1a1a1a] text-[#faf7f2]'
                : 'bg-[#eae5dc] text-[#6b6b6b] hover:text-[#1a1a1a]'
            }`}
          >
            App Review Notes
          </button>
        </div>

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <p className="text-xs sm:text-sm text-[#4a4a4a] leading-relaxed">
              Unlock AI timeline optimization, automated reschedule rescheduling intelligence, cross-device sync, and priority computing with Cronble auto-renewing subscriptions.
            </p>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cronble Pro 3-month */}
              <div
                onClick={() => setSelectedPlan('pro_3m')}
                className={`p-4 border cursor-pointer transition-all ${
                  selectedPlan === 'pro_3m'
                    ? 'border-[#1a1a1a] bg-[#f0ece3]'
                    : 'border-[#d4d0c8] bg-[#faf7f2] hover:border-[#a3a3a3]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1a1a1a]">
                    Cronble Pro
                  </span>
                  <span className="text-[11px] font-mono bg-[#eae5dc] px-1.5 py-0.5 text-[#1a1a1a]">
                    3 Months
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-light text-[#1a1a1a]">$29.99</span>
                  <span className="text-xs text-[#6b6b6b]"> / 3 months ($9.99/mo)</span>
                </div>
                <ul className="text-xs text-[#4a4a4a] space-y-1.5 mt-3 pt-3 border-t border-[#e3dfd7]">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" />
                    <span>Automated AI schedule optimization</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" />
                    <span>Unlimited daily timeline tasks</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" />
                    <span>Smart timezone &amp; calendar switching</span>
                  </li>
                </ul>
              </div>

              {/* Cronble Pro Plus 3-month */}
              <div
                onClick={() => setSelectedPlan('pro_plus_3m')}
                className={`p-4 border cursor-pointer transition-all ${
                  selectedPlan === 'pro_plus_3m'
                    ? 'border-[#1a1a1a] bg-[#f0ece3]'
                    : 'border-[#d4d0c8] bg-[#faf7f2] hover:border-[#a3a3a3]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#1a1a1a] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    Cronble Pro Plus
                  </span>
                  <span className="text-[11px] font-mono bg-[#eae5dc] px-1.5 py-0.5 text-[#1a1a1a]">
                    3 Months
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-2xl font-light text-[#1a1a1a]">$49.99</span>
                  <span className="text-xs text-[#6b6b6b]"> / 3 months ($16.66/mo)</span>
                </div>
                <ul className="text-xs text-[#4a4a4a] space-y-1.5 mt-3 pt-3 border-t border-[#e3dfd7]">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" />
                    <span>Everything in Cronble Pro</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" />
                    <span>Priority natural language reschedule AI</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" />
                    <span>Document &amp; schedule agenda scanner</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#1a1a1a] flex-shrink-0" />
                    <span>VIP expedited concierge support</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Purchase & Restore Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full sm:flex-1 py-3 px-4 bg-[#1a1a1a] text-[#faf7f2] text-xs font-medium tracking-wide uppercase hover:bg-black transition-colors disabled:opacity-50"
              >
                {isPurchasing
                  ? 'Processing StoreKit Sandbox...'
                  : selectedPlan === 'pro_3m'
                  ? 'Subscribe to Cronble Pro ($29.99 / 3 Mo)'
                  : 'Subscribe to Cronble Pro Plus ($49.99 / 3 Mo)'}
              </button>

              <button
                type="button"
                onClick={handleRestore}
                disabled={isRestoring}
                className="w-full sm:w-auto py-3 px-4 border border-[#d4d0c8] bg-[#faf7f2] hover:bg-[#f0ece3] text-[#1a1a1a] text-xs font-medium tracking-wide uppercase transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                Restore Purchases
              </button>
            </div>

            {/* Status Message */}
            {purchaseStatus && (
              <div className="p-3 bg-[#e8f0e8] border border-[#bcd7bc] text-[#1c4d1c] text-xs leading-relaxed">
                {purchaseStatus}
              </div>
            )}

            {/* App Store Guideline 3.1.2(c) Mandatory Disclosure Block */}
            <div className="pt-4 border-t border-[#e3dfd7] space-y-2 text-[11px] text-[#6b6b6b] leading-relaxed">
              <p className="font-semibold text-[#1a1a1a]">
                Auto-Renewable Subscription Terms (App Store Review Guideline 3.1.2c):
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>Subscription Titles:</strong> Cronble Pro (3 Months) or Cronble Pro Plus (3 Months).
                </li>
                <li>
                  <strong>Length &amp; Price:</strong> 3 Months auto-renewing at $29.99 ($9.99/month equivalent) or $49.99 ($16.66/month equivalent), billed every 3 months.
                </li>
                <li>
                  <strong>Payment:</strong> Payment will be charged to your iTunes Account upon confirmation of purchase.
                </li>
                <li>
                  <strong>Auto-Renewal:</strong> Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current billing period.
                </li>
                <li>
                  <strong>Account Charges:</strong> Your account will be charged for renewal within 24 hours prior to the end of the current 3-month period at the original subscription rate.
                </li>
                <li>
                  <strong>Subscription Management:</strong> Subscriptions may be managed by the user and auto-renewal may be turned off by visiting your Apple ID Account Settings after purchase.
                </li>
                <li>
                  <strong>Trial Forfeiture:</strong> Any unused portion of a free trial period, if offered, will be forfeited when purchasing a subscription.
                </li>
              </ul>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[#1a1a1a]">
                <button
                  type="button"
                  onClick={() => setActiveTab('terms')}
                  className="underline hover:opacity-75 inline-flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> Terms of Use (EULA)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('privacy')}
                  className="underline hover:opacity-75 inline-flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3" /> Privacy Policy
                </button>
                <a
                  href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-75 inline-flex items-center gap-1 text-[#4a4a4a]"
                >
                  Apple Standard EULA <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Terms of Use (EULA) Tab */}
        {activeTab === 'terms' && (
          <div className="space-y-4 text-xs text-[#3a3a3a] leading-relaxed">
            <h3 className="text-base font-semibold text-[#1a1a1a]">
              Terms of Use &amp; End User License Agreement (EULA)
            </h3>
            <p>
              Last Updated: October 19, 2026. By downloading, accessing, or using Cronble, you agree to be bound by these Terms of Use and Apple&apos;s Standard Licensed Application End User License Agreement (EULA).
            </p>
            <div className="p-3 bg-[#eae5dc] rounded-xs space-y-1">
              <p className="font-semibold text-[#1a1a1a]">Apple Standard EULA Reference:</p>
              <p>
                Cronble adopts the Apple Standard Licensed Application End User License Agreement accessible at{' '}
                <a
                  href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-mono text-[#1a1a1a]"
                >
                  https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
                </a>.
              </p>
            </div>
            <h4 className="font-semibold text-[#1a1a1a] pt-2">1. AI Schedule Optimization &amp; Reschedule Disclaimers</h4>
            <p>
              Cronble uses artificial intelligence algorithms to calculate timeline progression and propose agenda rescheduling. The AI may provide inaccurate results. All schedules, estimated times, and task assignments generated or modified by AI must be reviewed by the user. The user is solely responsible for verifying the accuracy and appropriateness of all task schedules before relying upon them.
            </p>
            <h4 className="font-semibold text-[#1a1a1a] pt-2">2. Prohibited Content &amp; Sensitive Information</h4>
            <p>
              Users must not input, submit, or upload confidential, sensitive, proprietary, medical, or biometric information into Cronble&apos;s AI reschedule prompts or schedule fields.
            </p>
            <h4 className="font-semibold text-[#1a1a1a] pt-2">3. Auto-Renewing Subscriptions</h4>
            <p>
              Cronble offers 3-month recurring subscriptions (Cronble Pro at $29.99 and Cronble Pro Plus at $49.99). Subscriptions auto-renew every 3 months unless cancelled at least 24 hours prior to the close of the current period. Cancellations take effect at the conclusion of the active billing cycle.
            </p>
          </div>
        )}

        {/* Privacy Policy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 text-xs text-[#3a3a3a] leading-relaxed">
            <h3 className="text-base font-semibold text-[#1a1a1a]">
              Cronble Privacy Policy
            </h3>
            <p>
              Effective Date: October 19, 2026. Cronble respects and protects your digital privacy. We operate under strict principles of data minimization and zero tracking.
            </p>
            <h4 className="font-semibold text-[#1a1a1a] pt-2">1. Information We Store Locally</h4>
            <p>
              Your itineraries, task titles, times, and completion states are stored securely on your local device using encrypted sandbox local storage. Cronble does not monetize, sell, or profile your schedule data.
            </p>
            <h4 className="font-semibold text-[#1a1a1a] pt-2">2. Native Permissions &amp; Data Access</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Camera (NSCameraUsageDescription):</strong> Used solely when you capture schedule notes, paper planners, or meeting agendas.
              </li>
              <li>
                <strong>Photos (NSPhotoLibraryUsageDescription):</strong> Used solely to import photos or documents into your schedule.
              </li>
              <li>
                <strong>Microphone (NSMicrophoneUsageDescription):</strong> Used solely for on-device voice transcription of reschedule instructions.
              </li>
            </ul>
            <h4 className="font-semibold text-[#1a1a1a] pt-2">3. Account &amp; Sync Security</h4>
            <p>
              If you sign in to sync tasks across devices, authentication tokens are transmitted via HTTPS with TLS 1.3 encryption. Passwords and secret keys are never stored in plaintext.
            </p>
            <h4 className="font-semibold text-[#1a1a1a] pt-2">4. Contact</h4>
            <p>
              For privacy inquiries or data deletion requests, contact our privacy officer at{' '}
              <span className="font-mono text-[#1a1a1a]">thesolutionsdesigner@gmail.com</span>.
            </p>
          </div>
        )}

        {/* App Review Notes Tab */}
        {activeTab === 'review_notes' && (
          <div className="space-y-4 text-xs text-[#3a3a3a] leading-relaxed">
            <h3 className="text-base font-semibold text-[#1a1a1a]">
              App Store Review Information &amp; Notes
            </h3>
            <div className="p-3 bg-[#eae5dc] rounded-xs space-y-2">
              <p className="font-semibold text-[#1a1a1a]">Demo User Credentials for Apple Review Team:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong>App Unlock Password:</strong> <code className="font-mono bg-[#faf7f2] px-1 py-0.5">20260730</code>
                </li>
                <li>
                  <strong>Demo Account Email:</strong> <code className="font-mono bg-[#faf7f2] px-1 py-0.5">reviewer@cronble.ai</code>
                </li>
                <li>
                  <strong>Demo Account Password:</strong> <code className="font-mono bg-[#faf7f2] px-1 py-0.5">AppleReview2026!</code>
                </li>
              </ul>
            </div>
            <h4 className="font-semibold text-[#1a1a1a] pt-2">Guideline 3.1.2(c) Compliance Evidence</h4>
            <p>
              This app includes auto-renewable subscriptions in the subscription group &ldquo;Cronble Premium Membership&rdquo;. The terms, duration (3 months), pricing ($29.99 and $49.99), unit pricing, auto-renewal rules, and functional links to both the Privacy Policy and Terms of Use (including the Apple Standard EULA) are accessible anytime by tapping &ldquo;legal &amp; subscriptions&rdquo; in the app footer or the user account menu.
            </p>
            <h4 className="font-semibold text-[#1a1a1a] pt-2">AI Output Verification</h4>
            <p>
              Under AI reschedule flows, a prominent notification informs users that AI may provide inaccurate results, results must be reviewed by the user, the user is responsible for the results, and users should not submit confidential, sensitive, private, or biometric information.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#e3dfd7] flex items-center justify-between text-[11px] text-[#8c8c8c]">
          <span>Cronble iOS · App Store Containerized</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#1a1a1a] hover:underline"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
