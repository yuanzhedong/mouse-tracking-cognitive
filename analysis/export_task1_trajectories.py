#!/usr/bin/env python3
"""Export Task 1 raw mouse trajectories as one long CSV (one row per sample).

Input, either:
  * the Drive data folder (or its raw/ and processed/ subfolders) downloaded
    as-is — the JSON upload files; or
  * the Sheet tabs task1_trajectories and task1_trials downloaded as CSV
    (File → Download → CSV), given as two file paths.

Output columns, one row per 16-ms sample:
  pid, session_id, mt_version, block, trial, trial_id, trial_type,
  left_id, right_id, chosen_id, chose_goal, rt_ms, initiation_time,
  warning_shown, input_type, sample_idx, t_ms, x, y, x_window, y_window,
  stage_w, stage_h, stage_left, stage_top, window_w, window_h
t_ms = ms since the options appeared (0 = the START click); x / y = px from
the task area's top-left; x_window / y_window = the same point in window px.
Rows from TEST codes are left out unless --include-test.

Usage:
  python3 analysis/export_task1_trajectories.py DATA_FOLDER -o trajectories.csv
  python3 analysis/export_task1_trajectories.py task1_trajectories.csv task1_trials.csv -o trajectories.csv
"""
import argparse, csv, json, os, sys

TRIAL_COLS = ['trial_type', 'left_id', 'right_id', 'chosen_id', 'chose_goal', 'rt_ms',
              'initiation_time', 'warning_shown', 'input_type', 'mt_version']
OUT = ['pid', 'session_id', 'mt_version', 'block', 'trial', 'trial_id', 'trial_type',
       'left_id', 'right_id', 'chosen_id', 'chose_goal', 'rt_ms', 'initiation_time',
       'warning_shown', 'input_type', 'sample_idx', 't_ms', 'x', 'y', 'x_window', 'y_window',
       'stage_w', 'stage_h', 'stage_left', 'stage_top', 'window_w', 'window_h']


def key(r):
    return (str(r.get('session_id')), str(r.get('block')), str(r.get('trial')))


def from_json_folder(folder):
    traj, trials = [], []
    for root, _, files in os.walk(folder):
        for f in sorted(files):
            if not f.endswith('.json'):
                continue
            with open(os.path.join(root, f), encoding='utf-8') as fh:
                rec = json.load(fh)
            tables = (rec.get('body') or {}).get('tables') or {}
            traj += tables.get('task1_trajectories', [])
            trials += tables.get('task1_trials', [])
    return traj, trials


def from_csvs(traj_csv, trials_csv):
    with open(traj_csv, encoding='utf-8') as a, open(trials_csv, encoding='utf-8') as b:
        return list(csv.DictReader(a)), list(csv.DictReader(b))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('inputs', nargs='+')
    ap.add_argument('-o', '--out', default='task1_trajectories_long.csv')
    ap.add_argument('--include-test', action='store_true', help='keep TEST… codes')
    a = ap.parse_args()
    if len(a.inputs) == 1 and os.path.isdir(a.inputs[0]):
        traj, trials = from_json_folder(a.inputs[0])
    elif len(a.inputs) == 2:
        traj, trials = from_csvs(*a.inputs)
    else:
        sys.exit('give one data folder, or task1_trajectories.csv and task1_trials.csv')

    info = {key(r): r for r in trials}
    seen, n_rows = set(), 0
    with open(a.out, 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=OUT)
        w.writeheader()
        for r in traj:
            pid = str(r.get('pid', ''))
            if pid.upper().startswith('TEST') and not a.include_test:
                continue
            k = key(r)
            if k in seen:            # a re-sent upload can arrive twice
                continue
            seen.add(k)
            tr = info.get(k, {})
            ts, xs, ys = (json.loads(r[c]) if isinstance(r[c], str) else r[c] for c in ('t_ms', 'x', 'y'))
            # stage offset / window size: on the trajectory row (newer data) or the trial row
            g = lambda c: r.get(c, '') if r.get(c, '') != '' else tr.get(c, '')
            left, top = g('stage_left'), g('stage_top')
            for i, (t, x, y) in enumerate(zip(ts, xs, ys)):
                row = {c: tr.get(c, '') for c in TRIAL_COLS}
                row.update(pid=pid, session_id=r.get('session_id', ''), mt_version=r.get('mt_version', row['mt_version']),
                           block=r.get('block', ''), trial=r.get('trial', ''), trial_id=r.get('trial_id', ''),
                           sample_idx=i, t_ms=t, x=x, y=y,
                           x_window=(x + float(left)) if left != '' else '',
                           y_window=(y + float(top)) if top != '' else '',
                           stage_w=g('stage_w'), stage_h=g('stage_h'), stage_left=left, stage_top=top,
                           window_w=g('window_w'), window_h=g('window_h'))
                w.writerow(row)
                n_rows += 1
    print(f'{len(seen)} trials, {n_rows} samples → {a.out}')


if __name__ == '__main__':
    main()
