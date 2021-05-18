### Fuzzing Operations Performed

1. Swapping "==" with "!=".
2. Swapping "0" with "1"
3. Changing contents of the String.
4. Swapping "<" and ">"
5. Swapping true and false.
6. Swapping "AND" with "OR".

### Steps Performed.
1. Remove the comments in a code so that we do not perform any mutations on these lines as they would not have any impact on the code.
2. Select a random value between 1% and 10%. This will be the maximum amount of mutation allowed in a code.
3. Run above-mentioned fuzzing operations.
4. Compare the newly generated line with the old one. If the line has changed, then increment the mutation counter.
5. Compute the % mutations using (mutation counter)/(total lines) and if it is more than maximum mutation value, then break out of loop.
6. If compilation error is found, do not increment the iteration counter (Perform same steps for same iteration), else increase the counter.

### Useful-tests output [[File]](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/useful-test-output.md)
<p align="center">
<img src="https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-16/blob/master/extras/output.png" alt="demo"/>
</p>
