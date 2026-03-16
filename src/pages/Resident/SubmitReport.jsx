import { useState } from "react";
import API from "../../api/axios";

function SubmitReport() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [purok, setPurok] = useState("");
  const [personInvolved, setPersonInvolved] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/reports", {
        category,
        description,
        location,
        purok,
        personInvolved
      });

      alert("Report submitted successfully!");

      setCategory("");
      setDescription("");
      setLocation("");
      setPurok("");

    } catch (err) {
      console.error(err);
      alert("Failed to submit report");
    }
  };

  return (
    <div>
      <h2>Submit Report</h2>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Purok"
          value={purok}
          onChange={(e) => setPurok(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Person Involved"
          value={personInvolved}
          onChange={(e) => setPersonInvolved(e.target.value)}
          required
        />

        <button type="submit">Submit Report</button>

      </form>
    </div>
  );
}

export default SubmitReport;