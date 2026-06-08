import Chat from "../components/Chat";
import "./dashboard.css";

function UserDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2 className="title">Dashboard </h2>

        <Chat />
      </div>
    </div>
  );
}

export default UserDashboard;


