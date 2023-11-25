#!/usr/bin/env python3
import numpy as np
import matplotlib.pyplot as plt
import csv

interval = (0, 4)  # start, end
accuracy = 0.005
reps = 600  # number of repetitions
numtoplot = 200
lims = np.zeros(reps)

fig, biax = plt.subplots()
fig.set_size_inches(16, 9)

with open('../public/fractals/logistic-map-data.csv', 'w', newline='') as csvfile:
    simplified_points = {}

    lims[0] = np.random.rand()
    for r in np.arange(interval[0], interval[1], accuracy):
        for i in range(reps - 1):
            lims[i + 1] = r * lims[i] * (1 - lims[i])
            key = f"{r}_{lims[i+1]}";
            if key in simplified_points:
                simplified_points[key] = { 'x': r, 'y': lims[i+1], 'iteration': i+1, 'count': simplified_points[key]["count"]+1 }
            else:
                simplified_points[key] = { 'x': r, 'y': lims[i+1], 'iteration': i+1, 'count': 1 }
#             coordinate_writer.writerow({'x': r, 'y': lims[i+1], 'iteration': i+1})
        biax.plot([r] * numtoplot, lims[reps - numtoplot :], "b.", markersize=0.02)
    fieldnames = ['x', 'y', 'iteration', 'count']
    coordinate_writer = csv.DictWriter(csvfile, fieldnames)
    coordinate_writer.writeheader()
    for point in simplified_points.values():
        coordinate_writer.writerow(point)

    biax.set(xlabel="r", ylabel="x", title="logistic map")
    plt.show()
