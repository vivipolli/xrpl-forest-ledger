import { Reservation, ReservationStatus } from "../types/reservation";

const ReservationCard = ({ reservation }: { reservation: Reservation }) => {
  const getStatusBadgeClass = (status: ReservationStatus): string => {
    switch (status) {
      case "approved":
        return "px-2 py-1 rounded-full text-xs font-medium bg-primary-color text-black";
      case "pending":
        return "px-2 py-1 rounded-full text-xs font-medium bg-accent-color text-black";
      case "rejected":
        return "px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white";
      default:
        return "px-2 py-1 rounded-full text-xs font-medium bg-gray-500 text-white";
    }
  };

  const getStatusText = (status: ReservationStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-background-light p-6 rounded-lg shadow-md w-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-text-default">
          {reservation.nftData?.title || "Reservation"}
        </h3>
        <span className={getStatusBadgeClass(reservation.status)}>
          {getStatusText(reservation.status)}
        </span>
      </div>
      {reservation.nftData?.imageUrl && (
        <div className="mb-4 aspect-square overflow-hidden rounded-md">
          <img
            src={reservation.nftData.imageUrl}
            alt="Reservation"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm text-text-muted">
          Created: {reservation.createdAt}
        </p>
        {reservation.nftData?.issueDate && (
          <p className="text-sm text-text-muted">
            Issued: {reservation.nftData.issueDate}
          </p>
        )}
        {reservation.nftData?.description && (
          <p className="text-sm text-text-default mt-2">
            {reservation.nftData.description}
          </p>
        )}
        {reservation.nftData?.attributes && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-text-default mb-2">
              Attributes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(reservation.nftData.attributes).map(
                ([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-text-muted">
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      :
                    </span>{" "}
                    <span className="text-text-default">{String(value)}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationCard;
