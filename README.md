[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
![GitHub Repo stars](https://img.shields.io/github/stars/FelixderAndere/Radioactive-Decay-Visualisation)
![GitHub issues](https://img.shields.io/github/issues/FelixderAndere/Radioactive-Decay-Visualisation)
![GitHub Pages](https://img.shields.io/badge/demo-online-brightgreen.svg)
![GitHub release](https://img.shields.io/github/v/release/FelixderAndere/Radioactive-Decay-Visualisation)
[![Live Demo](https://img.shields.io/badge/live-demo-blue?logo=github)](https://felixderandere.github.io/Radioactive-Decay-Visualisation/)

# Radioactive-Decay-Visualization

# Radioactive-Decay-Visualization

A simple simulation and visualisation of radioactive decay.

## Demo

https://felixderandere.github.io/Radioactive-Decay-Visualisation/

## Content
- Python cli
- Webapp

## Screenshot

![App Screenshot](https://github.com/FelixderAndere/Radioactive-Decay-Visualisation/blob/main/image.png)

## Features

- Simulate the Decay for a given time.
- Change simulation parameters like Atom amount or Step size.
- Edit and configure your desired decay chain.
- Visualization via an Atomic lattice and a Chart
- Compare the theoretical and simulated chart.

## Physical / Mathematical Explanation

Radioactive decay is random for each single atom, but predictable for a large
number of atoms. The probability that one atom decays during a time step `dt`
depends on the decay constant `lambda`:

```text
lambda = ln(2) / T_1/2
p = 1 - exp(-lambda * dt)
```

`T_1/2` is the half-life of the substance. After one half-life, the expected
amount of the original substance is reduced to 50%.

### Theory

The **Theory** mode shows the mathematical expectation value of the decay
chain. Instead of rolling a random value for every atom, it solves the decay
system continuously. For one substance this follows the exponential decay law:

```text
N(t) = N_0 * exp(-lambda * t)
```

For a decay chain with several substances, the simulator stores all decay rates
and decay products in a matrix. The distribution after time `t` is calculated
with the matrix exponential:

```text
values(t) = exp(A * t) * values(0)
```

This produces a smooth curve because it represents the average result expected
from many repeated experiments.

### Random

The **Random** mode simulates a finite number of atoms step by step. During each
time step, every atom receives a random test against the physical decay
probability `p`. If it decays, a decay product is chosen according to the
configured branching probabilities.

Because this mode uses random events and a limited atom count, its curve can
fluctuate around the theoretical curve. With more atoms or many repeated runs,
the random result approaches the Theory curve statistically.

