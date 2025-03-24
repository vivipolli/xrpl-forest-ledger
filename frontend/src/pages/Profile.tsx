import { useWeb3Auth } from "@web3auth/modal-react-hooks";

function Profile() {
  const { userInfo } = useWeb3Auth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Profile</h1>
      <div className="bg-card text-text-default shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        {userInfo && (
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-text-muted">Name</p>
              <p className="text-text-default">{userInfo.name}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-text-muted">Email</p>
              <p className="text-text-default">{userInfo.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
