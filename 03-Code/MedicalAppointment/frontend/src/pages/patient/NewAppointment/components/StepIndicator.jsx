/**
 * StepIndicator Component
 * Shows the current step in the appointment wizard
 */
import PropTypes from 'prop-types';
export default function StepIndicator({ currentStep, totalSteps = 2 }) {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`w-24 h-1 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

StepIndicator.propTypes = {
  currentStep: PropTypes.number.isRequired,   
  totalSteps: PropTypes.number,               
};
