import { ReservationForm } from "./ReservationForm";

const EmptyReservationCard = ({
  showForm,
  setShowForm,
  formData,
  handleInputChange,
  handleSubmit,
  isLoading,
  connected,
  accountError = false,
}: {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  formData: any;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  connected: boolean;
  accountError?: boolean;
}) => {
  return (
    <div className="bg-background-light p-6 rounded-lg shadow-md flex flex-col justify-center items-center w-full h-full min-h-[300px] border border-dashed border-gray-600">
      {showForm ? (
        <ReservationForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          setShowForm={setShowForm}
        />
      ) : (
        <div className="text-center">
          {connected ? (
            accountError ? (
              <>
                <p className="text-lg mb-4 text-text-default">
                  Your XRPL account needs to be activated. Please fund your
                  account with some XRP first.
                </p>
                <p className="text-sm mb-4 text-text-muted">
                  On XRPL, accounts need a minimum reserve of XRP to be
                  activated.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg mb-4 text-text-default">
                  You don't have any reservations yet.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-primary-color text-black px-6 py-2 rounded-md hover:opacity-90 transition-colors font-medium"
                >
                  Create Reservation
                </button>
              </>
            )
          ) : (
            <p className="text-lg mb-4 text-text-default">
              Connect your wallet to create a reservation.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyReservationCard;
