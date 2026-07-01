[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
![GitHub Repo stars](https://img.shields.io/github/stars/FelixderAndere/Radioactive-Decay-Visualisation)
![GitHub issues](https://img.shields.io/github/issues/FelixderAndere/Radioactive-Decay-Visualisation)
![GitHub Pages](https://img.shields.io/badge/demo-online-brightgreen.svg)
![GitHub release](https://img.shields.io/github/v/release/FelixderAndere/Radioactive-Decay-Visualisation)
[![Live Demo](https://img.shields.io/badge/live-demo-blue?logo=github)](https://felixderandere.github.io/Radioactive-Decay-Visualisation/)


# Radioactive-Decay-Visualisation
A simple simulation and visualisation of radioactive decay.


## Demo
### See the Website here:
https://felixderandere.github.io/Radioactive-Decay-Visualisation/


### Screenshot
![App Screenshot](https://github.com/FelixderAndere/Radioactive-Decay-Visualisation/blob/main/test/images/Demo.png)
*fig. 1: Two Screenshots of the Website. On the left "Theory" view, on the right "Random" view with simulated values.*

## Content
- Python cli
- Webapp


## Features
- Simulate the Decay for a given time.
- Change simulation parameters like Atom amount or Step size.
- Edit and Select your desired decay chain.
- Visualisation via an Atomic lattice and a Chart
- Compare the theoretical and simulated chart.


## Physical / Mathematical Explanation
Radioactive decay is probabilistic on the particle level, but stable in the
average over many particles. For a nucleus with half-life `T_1/2`, the decay
constant is

```text
lambda = ln(2) / T_1/2
p = 1 - exp(-lambda * dt)
```

where `p` is the probability that one particle decays during the time step
`dt`. A shorter half-life means a larger `lambda` and therefore a faster
decay. After one half-life, the expected amount of the original substance is
reduced to 50%.

### Theory

The **Theory** mode computes the expected value of the system without random
sampling. Every step uses the decay probability above, but replaces the random
outcome with its mean value. For one substance this is the exponential decay
law:

```text
N(t) = N_0 * exp(-lambda * t)
```

For a decay chain, each substance is updated from its current amount by
subtracting the expected decayed fraction and distributing that fraction to
its decay products according to the configured branching ratios. In discrete
form, for one step of length `dt`:

```text
decayed = N(t) * (1 - exp(-lambda * dt))
N_next = N(t) - decayed
product_next = product_current + decayed * branching_ratio
```

The result is a smooth, deterministic curve that represents the mean behavior
of infinitely many repeated experiments.

### Random
The **Random** mode uses the same physical decay probability, but applies it to
an explicit finite particle population. Internally, the simulator converts the
current amount into a sample size, performs random trials for that sample, and
then scales the result back to the displayed fraction. In practice this behaves
like a binomial process:

```text
n = round(N * particleCount)
c ~ Binomial(n, p)
decayed = c / particleCount
```

If a substance decays, its decayed fraction is distributed to the configured
products using the branching ratios. Because the number of particles is finite,
the curve fluctuates around the Theory curve and can deviate more strongly for
smaller populations or larger time steps. As the particle count increases, the
Random mode approaches the deterministic expectation statistically.

## Discussion
The following screenshots (fig. 2 and fig. 3) show an analysis with the /test/test.js script.
Different step sizes in the simulation of the preset "Demo" with 30 years are compared.
Note that the average values of the random simulations are going against the theoretical value with increasingly smaller steps.

![Screenshot of the Excel Analisys](https://github.com/FelixderAndere/Radioactive-Decay-Visualisation/blob/main/test/images/Demo_30j.png)
*fig. 2: Screenshots of the Website. Same Parameters as in the Test.*
![Screenshot of the Excel Analisys](https://github.com/FelixderAndere/Radioactive-Decay-Visualisation/blob/main/test/images/Analysis.png)
*fig. 3: Screenshot of an Excel analysis with diagrams for every substance in "Demo" and Box plots for different step sizes.*
