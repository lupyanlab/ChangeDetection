#!/usr/bin/env python
import sys
import random
import os
from itertools import permutations, combinations
import pandas as pd

separator = ","

# Assume numTrials will be less than or equal to the number of stims
def generateTrials(workerId, image_file, numTrials):
    if not os.path.exists("/batches_counts"):
        os.makedirs("/baches_counts")

    # Get list of images from the batches counts file in sorted order
    # but if the counts file doesn't exist, grab the list from the image_file directly.
    # We assume that the stim lists will be exactly the same but different ordering in
    # both cases.
    if os.path.exists("/batches_counts/" + image_file):
        with open("/batches_counts/" + image_file) as f:
            stim_count_list = [(stim, count) for stim, count in zip(f.readLine().split(separator), f.readLine().split(separator)]
        stim_list = [stim_count[0] for stim_count in stim_count_list.sort(lambda tuple: tuple[1])]

    else:
        images = pd.read_csv(image_file)
        stim_list = images.Image.tolist()
        with open("/batches_counts/" + image_file) as f:
            f.write(separator.join(stim_list) + "\n")
            f.write(separator.join([str(0) for i in range(len(stim_list))]) + "\n")

    
    testFile = open('trials/'+workerId+ '_trials.csv','w')

    header = separator.join(["workerId", "trialNum", "unmodified_image","modified_image"])
    print >>testFile, header

    trials = []
    
    random.seed(workerId)
    
    side = random.choice(['_L_','_R_']) #pick one mirror version to exclude
    stim_list = [item for item in stim_list if side not in item]
    
    stim_list = stim_list[:numTrials]
    random.shuffle(stim_list)
    
    # Practice
    unmodified_image = "catchCow1"
    modified_image = "catchCow2"
    trials.append(separator.join((str(workerId), "p1",unmodified_image,modified_image)))
    
    unmodified_image = "catchAirplane1"
    modified_image = "catchAirplane2"
    trials.append(separator.join((str(workerId), "p2",unmodified_image,modified_image)))
    
    for trial_num,cur_image in enumerate(stim_list):
        
        if image_file == 'rensink_images.csv':
            unmodified_image = cur_image+"1"
            modified_image = cur_image+"2"
        elif image_file == 'object_array_images.csv':
            unmodified_image = cur_image+"A"
            modified_image = cur_image+"B"
        elif image_file in ['rensink_wolfe_images.csv','rensink_wolfe_images_bottom_half.csv',rensink_wolfe_images.csv','rensink_wolfe_images_bottom_half.csv','rensink_wolfe_images_bottom_quarter.csv']:
            if cur_image.startswith('image'):
                unmodified_image = cur_image+"-a"
                modified_image = cur_image+"-b"
            elif "_present_" in cur_image: #wolfe stims
                unmodified_image = cur_image
                modified_image = cur_image.replace("present","absent")
            elif "_in_" in cur_image: #wolfe stims
                unmodified_image = cur_image
                modified_image = cur_image.replace("_in_","_neither_")
            else: #rensink stims
                unmodified_image = cur_image+"1"
                modified_image = cur_image+"2"

        
        trials.append(separator.join((str(workerId), str(trial_num+1),unmodified_image,modified_image)))     
    
    # Catch
    unmodified_image = "catchBoat1"
    modified_image = "catchBoat2"
    trials.append(separator.join((str(workerId), "catch",unmodified_image,modified_image)))

    for cur_trial in trials:
        print >>testFile, cur_trial
        
if __name__ == "__main__":
    trialList = generateTrials(sys.argv[1], sys.argv[2])



