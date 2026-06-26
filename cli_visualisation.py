from decay import DecaySimulator
import shutil
import math
import os

class CLI_visualisation():
    def __init__(self, substances: dict):
        self.simulator = DecaySimulator(substances)


    def run(self, years: int, dt: float = 1) -> None:
        os.system('cls' if os.name == 'nt' else 'clear')
        self.simulate_decay(years, dt)


    def simulate_decay(self, iterations: int, dt: float) -> None:
        """ Takes Subsstances the iteration amount and the dt."""
        for i in range(iterations):
            substances = self.simulator.simulate(dt)
            self.draw_output(substances, iterations, dt, i)


    def draw_output(self, substances: dict, iterations: int, dt: float, i: int) -> None:
        """Draw the current state of the decay simulation in the terminal."""

        term_width = shutil.get_terminal_size((80, 20)).columns
        bar_width = max(20, min(70, term_width - 40))

        names = list(substances.keys())
        values = [substances[name]["value"] for name in names]
        half_lives = [
            "∞" if substances[name]["half life"] == math.inf
            else str(substances[name]["half life"])
            for name in names
        ]

        name_width = max(len(name) for name in names)
        total = sum(values)

        char = "█"
        lines = []

        for name, value, half_life in zip(names, values, half_lives):
            frac = value / total if total else 0
            fill = min(bar_width, max(0, int(frac * bar_width + 0.5)))

            bar = char * fill + "-" * (bar_width - fill)

            lines.append(
                f"{name:>{name_width}} | {bar} | {frac*100:6.2f}% | t½ = {half_life}"
            )

        output = (
            "\033[H"
            f"Iteration {i + 1}/{iterations} (Δt = {dt} years)\n\n"
            + "\n".join(lines)
            + f"\n\nTotal: {total:.6f}\n"
        )

        print(output, end="")


if __name__ == "__main__":
    substances = {
        "A": {"value": 1, "half life": 5, "decay products": {"B" : 0.7, "C" : 0.3,}},
        "B": {"value": 0, "half life": 3, "decay products": {"C": 1,},},
        "C": {"value": 0, "half life": 8, "decay products": {"D": 1,},},
        "D": {"value": 0, "half life": 1, "decay products": {"E": 1,},},
        "E": {"value": 0, "half life": math.inf, "decay products": {}}
    }

    cli = CLI_visualisation(substances)
    cli.run(years=10000, dt=0.01)
