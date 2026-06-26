import math
import numpy as np
from scipy.linalg import expm

class DecaySimulator:
    def __init__(self, substances: dict):
        self.substances = substances
        self.names, self.idx, self.values, self.A = self.decay_matrix(substances)


    def decay_matrix(self, substances: dict) -> tuple:
        """Takes Substances dict and prepares Lists and a Matrix"""
        names = list(substances.keys())
        idx = {n: i for i, n in enumerate(names)}
        n = len(names)
        values = np.array([substances[n]["value"] for n in names], dtype=float)
        
        # Validate input values
        if sum(values) != 1.0:
            raise ValueError("Initial values must sum to 1.0")
        for substance in substances.values():
            if substance["half life"] < 0:
                raise ValueError("Half-life must be non-negative")
            if not all(0 <= portion <= 1 for portion in substance["decay products"].values()):
                raise ValueError("Decay product portions must be between 0 and 1")
            if sum(substance["decay products"].values()) > 1:
                raise ValueError("Sum of decay product portions cannot exceed 1")

        # Build the decay matrix A
        A = np.zeros((n, n), dtype=float)
        for name, data in substances.items():
            j = idx[name]
            T = data["half life"]
            lam = 0.0 if T == math.inf else math.log(2) / T
            A[j, j] = -lam
            for prod, portion in data["decay products"].items():
                i = idx[prod]
                A[i, j] += lam * portion

        return names, idx, values, A


    def simulate(self, years: int):
        """Simulates the decay over a given number of years."""
        new_values = expm(self.A * years) @ self.values
        return {name: round(float(new_values[i]),2) for i, name in enumerate(self.names)}


if __name__ == "__main__":
    # Example usage
    substances = {
    "A": {"value": 1, "half life": 5, "decay products": {"B" : 0.7, "C" : 0.3,}},
    "B": {"value": 0, "half life": 3, "decay products": {"C": 1,},},
    "C": {"value": 0, "half life": 8, "decay products": {"D": 1,},},
    "D": {"value": 0, "half life": 1, "decay products": {"E": 1,},},
    "E": {"value": 0, "half life": math.inf, "decay products": {}}
    }

    simulator = DecaySimulator(substances)
    result = simulator.simulate(years=5)
    print(result)
