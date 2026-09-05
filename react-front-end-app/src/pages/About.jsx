import styles from "./About.module.css";

const About = () => {
    return (
        <section className={styles.about}>
            <h3 className={styles.title}>About Vera</h3>
            <p className={styles.lead}>
                Vera is a workspace for small home care agencies: one place to
                manage visits, caregivers, and the record of care each patient
                receives. It is built on the approach behind Electronic Visit
                Verification, backing every visit with evidence of who was
                there, when, and what care was delivered, so agencies can rely
                on their own records. It started with conversations with agency
                owners in Philadelphia, whose biggest headaches were proving
                visits happened, tracking caregiver onboarding documents, and
                collecting patient signatures. The name comes from the Latin
                for true: at its core, Vera verifies that care actually
                happened.
            </p>

            <h4 className={styles.sectionTitle}>Home care is where the jobs are</h4>
            <div className={styles.statGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>5.4M</span>
                    <span className={styles.statLabel}>
                        direct care workers nationwide in 2024, the largest
                        workforce in the country (PHI)
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>$148B</span>
                    <span className={styles.statLabel}>
                        spent on home health care in the US in 2023, up 10.8
                        percent in a single year (CMS)
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>1 in 3</span>
                    <span className={styles.statLabel}>
                        home care workers is an immigrant; foreign-born workers
                        drove about half the workforce's growth over the past
                        decade (KFF, Health Affairs)
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statNumber}>2030</span>
                    <span className={styles.statLabel}>
                        the year every baby boomer is 65 or older and 1 in 5 US
                        residents is retirement age (US Census)
                    </span>
                </div>
            </div>
            <p className={styles.gridNote}>
                Demand keeps climbing with the population: BLS projects about
                718,900 openings for home health and personal care aides every
                year this decade, more than any other occupation.
            </p>

            <h4 className={styles.sectionTitle}>The pressure is local</h4>
            <ul className={styles.regionList}>
                <li>
                    New York employs about 623,000 home health and personal care
                    aides, the highest concentration relative to older residents
                    of any state.
                </li>
                <li>
                    Pennsylvania agencies report more than 112,500 caregiver
                    shifts going unfilled every month.
                </li>
                <li>
                    Across Pennsylvania, New Jersey, and New York, the share of
                    residents over 65 keeps climbing toward one in five and
                    beyond by 2030.
                </li>
            </ul>

            <h4 className={styles.sectionTitle}>Why verification matters</h4>
            <p className={styles.text}>
                Medicaid-funded personal care requires Electronic Visit
                Verification under the 21st Century Cures Act: proof of who
                delivered care, where, and when. Verified visits are what
                agencies bill from. Vera models that loop end to end: check in,
                assess, capture the patient's signature, and the visit becomes
                a claim.
            </p>

            <p className={styles.sources}>
                Sources:{" "}
                <a className={styles.sourceLink} href="https://www.bls.gov/ooh/healthcare/home-health-aides-and-personal-care-aides.htm" target="_blank" rel="noreferrer">
                    BLS Occupational Outlook Handbook
                </a>,{" "}
                <a className={styles.sourceLink} href="https://www.phinational.org/resource/direct-care-workers-in-the-united-states-key-facts-2025/" target="_blank" rel="noreferrer">
                    PHI Key Facts 2025
                </a>,{" "}
                <a className={styles.sourceLink} href="https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet" target="_blank" rel="noreferrer">
                    CMS National Health Expenditures
                </a>,{" "}
                <a className={styles.sourceLink} href="https://www.kff.org/medicaid/what-role-do-immigrants-play-in-the-direct-long-term-care-workforce/" target="_blank" rel="noreferrer">
                    KFF
                </a>,{" "}
                <a className={styles.sourceLink} href="https://www.healthaffairs.org/doi/10.1377/hlthaff.2024.01495" target="_blank" rel="noreferrer">
                    Health Affairs
                </a>,{" "}
                <a className={styles.sourceLink} href="https://www.census.gov/library/stories/2019/12/by-2030-all-baby-boomers-will-be-age-65-or-older.html" target="_blank" rel="noreferrer">
                    US Census Bureau
                </a>,{" "}
                <a className={styles.sourceLink} href="https://www.empirecenter.org/publications/health-workforce-jumps-by-another-10-percent/" target="_blank" rel="noreferrer">
                    Empire Center
                </a>,{" "}
                <a className={styles.sourceLink} href="https://whyy.org/articles/home-care-workers-pennsylvania/" target="_blank" rel="noreferrer">
                    WHYY
                </a>
            </p>
        </section>
    );
};

export default About;
