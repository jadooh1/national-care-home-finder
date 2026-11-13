# California RCFE and ARF onboarding

California stays unpublished. This report reconciles the existing eligibility counts with the current official open-data totals. It does not download, store, or publish facility rows, and it does not create an export date or a disclosure link.

## Reuse

The category rules, status list, and exclusion reasons remain the ones already recorded for the CDSS community-care files. Residential-care categories remain `RESIDENTIAL CARE ELDERLY` and `RCFE-CONTINUING CARE RETIREMENT COMMUNITY`. Adult-residential categories remain `ADULT RESIDENTIAL`, `ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS`, `COMMUNITY CRISIS HOME - ARF`, and `ENHANCED BEHAVIORAL SUPPORTS HOME - ARF`. Other categories in the adult-residential file stay excluded.

## Reconciliation on November 13, 2026

The official dataset is https://data.chhs.ca.gov/dataset/ccl-facilities. Counts below are aggregate totals from the published datastore. No facility row was stored.

Residential Care Facilities for the Elderly, resource `744d1583-f9eb-45b6-b0f8-b9a9dab936a6`: 12,522 rows. Structurally eligible: 12,521. Excluded: 1 blank category. The eligible status counts remain 7,939 licensed, 3,821 closed, 738 pending, and 23 on probation.

Adult Residential Facilities, resource `9f5d1d00-6b24-4f44-a158-9cbe4b43f117`: 10,498 rows. Structurally eligible: 8,610. Excluded: 1,888. Of those, 1,887 are a different license category and 1 is the shifted row whose original status, state, and ZIP stay as published. The eligible status counts remain 6,332 licensed, 1,840 closed, 429 pending, and 9 on probation.

## Source date

Every residential-care `file_date` value is still the raw text `5252025`. Every adult-residential `file_date` value is still the raw text `05252025`. The dataset temporal coverage is the text `Data as of 05252025`. The resource catalog times are `2025-05-27T23:43:15.194749` and `2025-05-27T23:42:09.892479`. The dataset metadata time is `2025-11-06T23:26:08.051889`. None of those values is adopted. `recorded_export_date` stays null.

## Status mapping

The four accepted original statuses stay `LICENSED`, `CLOSED`, `PENDING`, and `ON PROBATION`. A display label is available only for those exact values. The shifted row keeps the original status text `9/2/1997` and stays excluded. No original status is rewritten.

## Disclosure link

The facility-search welcome page remains https://www.cdss.ca.gov/inforesources/community-care-licensing/facility-search-welcome. The facility-search application at https://www.ccld.dss.ca.gov/carefacilitysearch/ responded HTTP 200 on November 13, 2026. An unverified detail path redirected back to that application. No open-data facility number was requested, and no per-facility disclosure link is recorded.

## Publication

Washington stays public. Oregon stays available only for the development project. California has no directory path and no map path. This review does not change database records.
