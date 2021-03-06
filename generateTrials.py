#!/usr/bin/env python
import sys
import random
import os
from itertools import permutations, combinations
import pandas as pd
import portalocker

separator = ","

# Assume numTrials will be less than or equal to the number of stims
def generateTrials(workerId, image_file, numTrials):
    if not os.path.exists("./batches_counts"):
        os.makedirs("./batches_counts")

    # Get list of images from the batches counts file in sorted order
    # but if the counts file doesn't exist, grab the list from the image_file directly.
    # We assume that the stim lists will be exactly the same but different ordering in
    # both cases.
    if os.path.exists("./batches_counts/" + image_file):
        f = open("./batches_counts/" + image_file, "r+")
        portalocker.lock(f, portalocker.LOCK_EX)
        [stimsLine, countsLine] = f.read().splitlines()
        # list of tuple (stim, count)
        stim_count_list = [(stim, int(count)) for stim, count in zip(stimsLine.split(separator), countsLine.split(separator))]
        # list of stims in ascending sorted order
        # TODO: Randomize stims by count
        all_stims_list = [stim_count[0] for stim_count in stim_count_list]
        stim_list = [stim_count[0] for stim_count in sorted(stim_count_list, key=lambda tuple: tuple[1])]

    else:
        images = pd.read_csv(image_file)
        stim_list = images.Image.tolist()
        all_stims_list = stim_list[:]
        stim_count_list = [(stim, 0) for stim in stim_list]
        f = open("./batches_counts/" + image_file, "r+")
        portalocker.lock(f, portalocker.LOCK_EX)

    testFile = open('trials/'+workerId+ '_trials.csv','w')

    header = separator.join(["workerId", "trialNum", "unmodified_image","modified_image","image"])
    print >>testFile, header

    trials = []
    
    random.seed(workerId)
    
    # Saying that it only takes either _L_ or _R_ pics
    side = random.choice(['_L_','_R_']) #pick one mirror version to exclude
    stim_list = [item for item in stim_list if side not in item] # Forgot this one
    
    f.seek(0)
    f.write(separator.join(all_stims_list) + "\n")
    stim_list = stim_list[:numTrials]
    f.write(separator.join([str(count + 1 if stim in set(stim_list) else count) for stim, count in stim_count_list]) + "\n")

    f.truncate()
    f.close()
    
    random.shuffle(stim_list)
    
    # Practice
    image = "catch_catchCow"
    unmodified_image = "catch_catchCow-a"
    modified_image = "catch_catchCow-b"
    trials.append(separator.join((str(workerId), "p1",unmodified_image,modified_image,image)))
    
    image = "catch_catchAirplane"
    unmodified_image = "catch_catchAirplane-a"
    modified_image = "catch_catchAirplane-b"
    trials.append(separator.join((str(workerId), "p2",unmodified_image,modified_image,image)))
    
    for trial_num,cur_image in enumerate(stim_list):
        unmodified_image = cur_image+"-a"
        modified_image = cur_image+"-b"

        
        trials.append(separator.join((str(workerId), str(trial_num+1),unmodified_image,modified_image,cur_image)))     
    
    # Catch
    image = "catch_catchBoat"
    unmodified_image = "catch_catchBoat-a"
    modified_image = "catch_catchBoat-b"
    trials.append(separator.join((str(workerId), "catch",unmodified_image,modified_image,image)))

    for cur_trial in trials:
        print >>testFile, cur_trial
        
if __name__ == "__main__":
    trialList = generateTrials(sys.argv[1], sys.argv[2], int(sys.argv[3]))



