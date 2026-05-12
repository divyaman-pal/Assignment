"""
C-DISC North India Engine — Streamlit dashboard.

Run with:  streamlit run src/cdisc/dashboard/app.py
or:        python -m cdisc dashboard
"""
from __future__ import annotations
import sys
from pathlib import Path

# Allow direct execution
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

import pandas as pd
import streamlit as st
from cdisc import db, config


st.set_page_config(page_title="C-DISC North India Engine", layout="wide", page_icon="🏗")

# ─── Header ───────────────────────────────────────────────────────
st.markdown(
    """
    <div style="background-color:#1A3C5E;padding:18px 24px;border-left:6px solid #E8732A;border-radius:4px;">
      <h1 style="color:white;margin:0;font-family:Calibri,sans-serif;">
        C-DISC North India Outreach Engine
      </h1>
      <p style="color:#B8C5D6;margin:4px 0 0 0;font-family:Calibri,sans-serif;">
        Live pipeline · G+1 / single-storey focus · Greater Noida · Rural UP · Resort belt
      </p>
    </div>
    """,
    unsafe_allow_html=True,
)
st.write("")

summary = db.pipeline_summary()

# ─── KPI row ──────────────────────────────────────────────────────
c1, c2, c3, c4 = st.columns(4)
c1.metric("Total leads", summary["total_leads"])
c2.metric("Auto-rejected (multi-storey)", summary["rejected"],
          help="Leads automatically rejected — apartments, towers, G+2+ etc.")
c3.metric("Messages queued", summary["messages_by_status"].get("queued", 0))
c4.metric("Messages sent", summary["messages_by_status"].get("sent", 0))

st.divider()

# ─── Funnel + segment breakdown ───────────────────────────────────
left, right = st.columns(2)

with left:
    st.subheader("Lead funnel")
    funnel_df = pd.DataFrame(
        [{"Stage": k, "Leads": v} for k, v in summary["by_status"].items()]
    ).sort_values("Leads", ascending=False)
    if len(funnel_df):
        st.bar_chart(funnel_df.set_index("Stage"))
    else:
        st.info("No leads yet. Run `python -m cdisc discover` first.")

with right:
    st.subheader("By segment")
    seg_df = pd.DataFrame(
        [{"Segment": k, "Leads": v} for k, v in summary["by_segment"].items()]
    ).sort_values("Leads", ascending=False)
    if len(seg_df):
        st.bar_chart(seg_df.set_index("Segment"))
    else:
        st.info("Score some leads to see segment distribution.")

st.divider()

# ─── Top-scoring leads ────────────────────────────────────────────
st.subheader("Top-scoring leads (G+1 fit)")

with db.conn() as conn:
    rows = pd.read_sql_query(
        """
        SELECT id, name, segment, district, state, final_score, fit_score, geo_score, segment_score, status, phone, email
        FROM leads
        WHERE rejected = 0
        ORDER BY final_score DESC
        LIMIT 50
        """,
        conn,
    )
st.dataframe(rows, use_container_width=True, hide_index=True)

st.divider()

# ─── Rejected leads (for audit) ───────────────────────────────────
with st.expander("🚫 Auto-rejected leads (multi-storey / high-rise / society)"):
    with db.conn() as conn:
        rej = pd.read_sql_query(
            "SELECT id, name, district, reject_reason FROM leads WHERE rejected = 1 ORDER BY id DESC LIMIT 200",
            conn,
        )
    st.dataframe(rej, use_container_width=True, hide_index=True)

# ─── Today's send queue ───────────────────────────────────────────
st.subheader("Queued messages (ready to send)")
with db.conn() as conn:
    msgs = pd.read_sql_query(
        """
        SELECT m.id, l.name AS lead, l.district, m.channel, m.language, m.touch_number,
               m.subject, m.scheduled_for
        FROM messages m JOIN leads l ON l.id = m.lead_id
        WHERE m.status = 'queued'
        ORDER BY m.touch_number, l.final_score DESC
        LIMIT 50
        """,
        conn,
    )
st.dataframe(msgs, use_container_width=True, hide_index=True)

st.caption("C-DISC Technologies · cdisctechnologies.com")
